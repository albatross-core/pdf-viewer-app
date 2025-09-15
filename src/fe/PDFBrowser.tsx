import { useEffect, useState } from "react";

interface S3File {
  key: string;
  lastModified: Date;
  size: number;
  etag: string;
}

interface PDFListResponse {
  files: S3File[];
  count: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

function getFileName(key: string): string {
  return key.split('/').pop() || key;
}

function PDFBrowser() {
  const [files, setFiles] = useState<S3File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefix, setPrefix] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFiles = async (searchPrefix: string = '') => {
    setLoading(true);
    setError(null);

    try {
      const url = `/api/file/list${searchPrefix ? `?prefix=${encodeURIComponent(searchPrefix)}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PDFListResponse = await response.json();
      setFiles(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(prefix);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(prefix);
  };

  const handleFileSelect = (key: string) => {
    setSelectedFile(key);
  };

  const handleDownload = (key: string) => {
    const url = `/api/file/get?key=${encodeURIComponent(key)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading PDF files...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button 
                  onClick={() => fetchFiles(prefix)}
                  className="mt-2 text-sm text-red-800 hover:text-red-900 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredFiles = files.filter(file => 
    getFileName(file.key).toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Enhanced Search Section */}
      <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Search & Filter</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search files
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by filename..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 text-sm placeholder-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSearch} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  S3 Prefix Filter
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., folder/subfolder/"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 text-sm placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => {setPrefix(''); setSearchQuery(''); fetchFiles('');}}
                    className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File List Panel */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  PDF Files
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {filteredFiles.length} of {files.length} files
                  </span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {filteredFiles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">No PDF files found</h4>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'Try adjusting your search terms' : 'No files match the current filter'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.key}
                      className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedFile === file.key 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
                      }`}
                      onClick={() => handleFileSelect(file.key)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex-shrink-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                selectedFile === file.key ? 'bg-blue-100' : 'bg-red-100'
                              }`}>
                                <svg className={`w-4 h-4 ${
                                  selectedFile === file.key ? 'text-blue-600' : 'text-red-600'
                                }`} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {getFileName(file.key)}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-2">
                            {file.key}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              {formatFileSize(file.size)}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDate(file.lastModified)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file.key);
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open
                          </button>
                        </div>
                      </div>
                      {selectedFile === file.key && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PDF Viewer Panel */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  PDF Preview
                </h3>
                {selectedFile && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(selectedFile)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in New Tab
                    </button>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Close preview"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {getFileName(selectedFile)}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {selectedFile}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl opacity-50"></div>
                    <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner">
                      <iframe
                        src={`/api/file/get?key=${encodeURIComponent(selectedFile)}`}
                        className="w-full h-[600px] border-none"
                        title={`PDF: ${getFileName(selectedFile)}`}
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                      <span className="text-xs font-medium text-gray-600">
                        Interactive PDF
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Select a PDF to preview</h4>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Click on any PDF file from the list to view it here. You can also open files in a new tab for full-screen viewing.
                  </p>
                  {files.length > 0 && files[0] && (
                    <button
                      onClick={() => handleFileSelect(files[0].key)}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View first PDF
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

export default PDFBrowser;