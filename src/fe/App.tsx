import PDFBrowser from "./PDFBrowser";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  PDF Browser
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Browse and view PDF files from S3
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <PDFBrowser />
      </main>
    </div>
  );
}

export default App;