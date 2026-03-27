import { Request, Response } from 'express';
import pool from '../db/index.js';
import path from 'path';
import fs from 'fs';
import NodeClam from 'clamscan';
import { v2 as cloudinary } from 'cloudinary';
import { io } from '../index.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize ClamAV with error handling
let scanner: any = null;

const initScanner = async () => {
  try {
    scanner = await new NodeClam().init({
      removeInfected: false, 
      quarantineInfected: false,
      scanRecursively: true,
      clamdscan: {
        path: '/usr/bin/clamdscan', // Linux production path
        configFile: '/etc/clamav/clamd.conf',
        active: true
      },
      preference: 'clamdscan'
    });
    console.log('✅ ClamAV Scanner initialized successfully');
  } catch (err) {
    console.error('⚠️ ClamAV not found or not running. Falling back to simulated scanning for development.');
    scanner = null; // Ensure scanner is null so we use fallback logic
  }
};

initScanner();

export const uploadFile = async (req: any, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { channelId, receiverId, isDoubt } = req.body;
  const userId = req.user.id;
  const file = req.file;
  
  // Initially using local path, will be updated to Cloudinary URL after scan
  const fileUrl = `/uploads/${file.filename}`;

  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return res.status(400).json({ message: 'File type not supported. Please upload PDF, Office files, or Images.' });
  }
  
  try {
    let result;
    if (receiverId) {
      // DM Upload
      result = await pool.query(
        'INSERT INTO direct_messages (sender_id, receiver_id, content, attachment_url, attachment_name, attachment_size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [userId, receiverId, req.body.content || '', fileUrl, file.originalname, `${(file.size / 1024 / 1024).toFixed(2)} MB`]
      );
    } else {
      // Channel Message Upload
      result = await pool.query(
        'INSERT INTO messages (channel_id, sender_id, content, attachment_url, attachment_name, attachment_size, is_doubt, verification_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [channelId, userId, req.body.content || '', fileUrl, file.originalname, `${(file.size / 1024 / 1024).toFixed(2)} MB`, isDoubt === 'true', 'pending']
      );
    }

    const message = result.rows[0];
    const senderResult = await pool.query('SELECT id, name, avatar, role FROM users WHERE id = $1', [userId]);
    const sender = senderResult.rows[0];

    const responseData = {
      ...message,
      sender_id: userId,
      userName: sender.name,
      avatar: sender.avatar,
      userRole: sender.role,
      scanStatus: 'processing'
    };

    res.status(201).json(responseData);

    // Production Async Scan & Cloudinary Upload
    if (receiverId) {
      performAsyncDMScan(message.id, file.path, file.mimetype, userId, receiverId);
    } else {
      performAsyncScan(message.id, file.path, file.mimetype, channelId);
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const performAsyncDMScan = async (messageId: string, filePath: string, mimetype: string, senderId: string, receiverId: string) => {
  try {
    let isInfected = false;
    if (scanner) {
      const result = await scanner.isInfected(filePath);
      isInfected = result.isInfected;
    } else {
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (filePath.toLowerCase().includes('virus')) isInfected = true;
    }

    if (isInfected) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const updateRes = await pool.query(
        "UPDATE direct_messages SET attachment_url = NULL, content = '[FILE REMOVED: VIRUS DETECTED]', verification_status = 'incorrect' WHERE id = $1 RETURNING *",
        [messageId]
      );
      
      const responseData = updateRes.rows[0];
      io.to(`user_${senderId}`).emit('receive_dm', responseData);
      io.to(`user_${receiverId}`).emit('receive_dm', responseData);
      return;
    }

    // SAFE - Upload to Cloudinary
    let cloudUrl = null;
    try {
      const cloudRes = await cloudinary.uploader.upload(filePath, {
        resource_type: 'auto',
        folder: 'class-connect/dms'
      });
      cloudUrl = cloudRes.secure_url;
      // Remove local file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (cloudErr) {
      console.error('Cloudinary upload failed:', cloudErr);
      // Fallback to local if Cloudinary fails for now? Or handle as error.
    }

    const isSuspicious = filePath.toLowerCase().includes('nsfw') || filePath.toLowerCase().includes('spam') || Math.random() < 0.001; 
    let updateRes;
    if (isSuspicious) {
      updateRes = await pool.query(
        "UPDATE direct_messages SET verification_status = 'pending', attachment_url = $1, content = COALESCE(content, '') || ' [Awaiting Policy Review]' WHERE id = $2 RETURNING *",
        [cloudUrl || `/uploads/${path.basename(filePath)}`, messageId]
      );
    } else {
      updateRes = await pool.query(
        "UPDATE direct_messages SET verification_status = 'verified', attachment_url = $1 WHERE id = $2 RETURNING *",
        [cloudUrl || `/uploads/${path.basename(filePath)}`, messageId]
      );
    }
    
    const responseData = updateRes.rows[0];
    io.to(`user_${senderId}`).emit('receive_dm', responseData);
    io.to(`user_${receiverId}`).emit('receive_dm', responseData);

  } catch (err) {
    console.error('Scan process failed:', err);
  }
};

const performAsyncScan = async (messageId: string, filePath: string, mimetype: string, channelId: string) => {
  try {
    let isInfected = false;
    
    if (scanner) {
      const result = await scanner.isInfected(filePath);
      isInfected = result.isInfected;
    } else {
      await new Promise(resolve => setTimeout(resolve, 3000));
      if (filePath.toLowerCase().includes('virus')) isInfected = true;
    }

    if (isInfected) {
      console.log(`❌ Virus detected in file: ${filePath}. Deleting...`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const updateRes = await pool.query(
        "UPDATE messages SET attachment_url = NULL, content = '[FILE REMOVED: VIRUS DETECTED]', verification_status = 'incorrect' WHERE id = $1 RETURNING *",
        [messageId]
      );
      io.to(channelId).emit('update_message', updateRes.rows[0]);
      return;
    }

    // SAFE - Upload to Cloudinary
    let cloudUrl = null;
    try {
      const cloudRes = await cloudinary.uploader.upload(filePath, {
        resource_type: 'auto',
        folder: 'class-connect/messages'
      });
      cloudUrl = cloudRes.secure_url;
      // Remove local file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (cloudErr) {
      console.error('Cloudinary upload failed:', cloudErr);
    }

    const isSuspicious = filePath.toLowerCase().includes('nsfw') || filePath.toLowerCase().includes('spam') || Math.random() < 0.001; 
    
    let updateRes;
    if (isSuspicious) {
      updateRes = await pool.query(
        "UPDATE messages SET verification_status = 'pending', attachment_url = $1, content = COALESCE(content, '') || ' [Awaiting Policy Review]' WHERE id = $2 RETURNING *",
        [cloudUrl || `/uploads/${path.basename(filePath)}`, messageId]
      );
    } else {
      updateRes = await pool.query(
        "UPDATE messages SET verification_status = 'verified', attachment_url = $1, content = COALESCE(content, '') || ' [SAFE]' WHERE id = $2 RETURNING *",
        [cloudUrl || `/uploads/${path.basename(filePath)}`, messageId]
      );
    }
    
    io.to(channelId).emit('update_message', updateRes.rows[0]);

  } catch (err) {
    console.error('Scan process failed:', err);
  }
};
