import { serve } from "bun";
import index from "./fe/index.html";
import { listPDFFiles, getS3FileStream } from "./service/s3";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/file/list": {
      async GET(req: Request) {
        try {
          const url = new URL(req.url);
          const prefix = url.searchParams.get('prefix') || '';
          
          const files = await listPDFFiles('alba-admin', prefix);
          
          return Response.json({
            files,
            count: files.length,
          });
        } catch (error) {
          console.error('Error listing files:', error);
          return Response.json(
            { error: "Failed to list PDF files" },
            { status: 500 }
          );
        }
      },
    },

    "/api/file/get": {
      async GET(req: Request) {
        try {
          const url = new URL(req.url);
          const key = url.searchParams.get('key');
          
          if (!key) {
            return Response.json(
              { error: "File key is required" },
              { status: 400 }
            );
          }
          
          return await getS3FileStream('alba-admin', key);
        } catch (error) {
          console.error('Error getting file:', error);
          return Response.json(
            { error: "Failed to get PDF file" },
            { status: 500 }
          );
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 PDF Browser Server running at ${server.url}`);