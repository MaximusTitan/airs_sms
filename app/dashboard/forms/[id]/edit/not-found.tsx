export default function NotFound() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto text-center">        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Form Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The form you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.
        </p>
        <a 
          href="/dashboard/forms"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Forms
        </a>
      </div>
    </div>
  );
}
