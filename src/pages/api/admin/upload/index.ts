import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { createAdminRoute } from '../../../../lib/middleware';
import { FileUploadSecurityService, FILE_UPLOAD_CONFIG } from '../../../../lib/fileUploadSecurity';
import { getClientIP } from '../../../../lib/auth';

// POST /api/admin/upload - Handle secure file uploads
export const POST: APIRoute = createAdminRoute(async ({ request }) => {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Check if the request is multipart/form-data
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Content-Type must be multipart/form-data'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const altText = formData.get('alt_text') as string;
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No file provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Perform comprehensive security validation
    const securityResult = await FileUploadSecurityService.processSecureUpload(file, clientIP);

    if (!securityResult.success) {
      // Log security incident
      console.warn('File upload security failure:', {
        fileName: file.name,
        clientIP,
        errors: securityResult.errors,
        quarantined: securityResult.quarantined,
        timestamp: new Date().toISOString()
      });

      return new Response(JSON.stringify({
        success: false,
        error: 'File failed security validation',
        details: securityResult.errors,
        quarantined: securityResult.quarantined
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sanitize folder name
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9-_]/g, '_');

    // Create upload directory path
    const uploadDir = join(process.cwd(), 'public', 'uploads', sanitizedFolder);
    const filePath = join(uploadDir, securityResult.fileName!);
    const publicUrl = `/uploads/${sanitizedFolder}/${securityResult.fileName}`;

    try {
      // Ensure upload directory exists
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Convert file to buffer and save
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(filePath, buffer);

      // Log successful upload
      console.info('Secure file upload successful:', {
        fileName: securityResult.fileName,
        originalName: file.name,
        size: file.size,
        hash: securityResult.fileHash,
        clientIP,
        timestamp: new Date().toISOString()
      });

      // Return success response with file information
      return new Response(JSON.stringify({
        success: true,
        data: {
          url: publicUrl,
          filename: securityResult.fileName,
          original_name: file.name,
          size: file.size,
          type: file.type,
          alt_text: altText || null,
          folder: sanitizedFolder,
          file_hash: securityResult.fileHash,
          uploaded_at: new Date().toISOString()
        },
        message: 'File uploaded successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (fileError) {
      console.error('Error saving file:', fileError);

      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to save file',
        details: fileError instanceof Error ? fileError.message : 'Unknown file system error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error handling upload:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to process upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// GET /api/admin/upload - List uploaded files (optional feature)
export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Check authentication
    if (!(await isAuthenticated(request))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // This is a basic implementation - you might want to enhance this
    // to actually read from the filesystem and return file metadata
    return new Response(JSON.stringify({
      success: true,
      data: [],
      message: 'File listing not implemented - use POST to upload files'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Error listing uploads:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to list uploads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
};

// OPTIONS /api/admin/upload - Handle CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
};