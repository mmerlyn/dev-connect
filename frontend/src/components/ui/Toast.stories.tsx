import { Alert, ToastProvider, useToast } from './Toast';

export default {
  title: 'UI/Toast',
  component: Alert,
};

export const SuccessAlert = () => (
  <div className="max-w-md p-4">
    <Alert
      variant="success"
      title="Success"
      message="Your changes have been saved successfully."
      onClose={() => {}}
    />
  </div>
);

export const ErrorAlert = () => (
  <div className="max-w-md p-4">
    <Alert
      variant="error"
      title="Error"
      message="Something went wrong. Please try again later."
      onClose={() => {}}
    />
  </div>
);

export const WarningAlert = () => (
  <div className="max-w-md p-4">
    <Alert
      variant="warning"
      title="Warning"
      message="Your session is about to expire. Please save your work."
      onClose={() => {}}
    />
  </div>
);

export const InfoAlert = () => (
  <div className="max-w-md p-4">
    <Alert
      variant="info"
      title="Information"
      message="A new version of the application is available."
      onClose={() => {}}
    />
  </div>
);

const ToastDemoInner = () => {
  const { showToast } = useToast();

  return (
    <div className="flex flex-wrap gap-3 p-4">
      <button
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={() => showToast('success', 'Success', 'Operation completed successfully!')}
      >
        Show Success Toast
      </button>
      <button
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        onClick={() => showToast('error', 'Error', 'Something went wrong.')}
      >
        Show Error Toast
      </button>
      <button
        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        onClick={() => showToast('warning', 'Warning', 'Please check your input.')}
      >
        Show Warning Toast
      </button>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => showToast('info', 'Info', 'Here is some useful information.')}
      >
        Show Info Toast
      </button>
    </div>
  );
};

export const ToastDemo = () => (
  <ToastProvider>
    <ToastDemoInner />
  </ToastProvider>
);
