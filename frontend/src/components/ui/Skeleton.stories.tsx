import { Skeleton } from './Skeleton';

export default {
  title: 'UI/Skeleton',
  component: Skeleton,
};

export const TextSkeleton = () => (
  <div className="max-w-md space-y-4 p-4">
    <Skeleton variant="text" />
  </div>
);

export const CircularSkeleton = () => (
  <div className="flex gap-4 p-4">
    <Skeleton variant="circular" />
    <Skeleton variant="circular" width="48px" height="48px" />
    <Skeleton variant="circular" width="64px" height="64px" />
  </div>
);

export const RectangularSkeleton = () => (
  <div className="max-w-md space-y-4 p-4">
    <Skeleton variant="rectangular" />
    <Skeleton variant="rectangular" width="200px" height="120px" />
  </div>
);

export const MultipleLines = () => (
  <div className="max-w-md space-y-6 p-4">
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">3 Lines</h3>
      <Skeleton variant="text" lines={3} />
    </div>
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">5 Lines</h3>
      <Skeleton variant="text" lines={5} />
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="max-w-sm rounded-lg border border-gray-200 p-4 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width="40px" height="40px" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="120px" />
        <Skeleton variant="text" width="80px" />
      </div>
    </div>
    <Skeleton variant="rectangular" height="160px" />
    <Skeleton variant="text" lines={3} />
    <div className="flex gap-4 pt-2">
      <Skeleton variant="text" width="60px" />
      <Skeleton variant="text" width="60px" />
      <Skeleton variant="text" width="60px" />
    </div>
  </div>
);
