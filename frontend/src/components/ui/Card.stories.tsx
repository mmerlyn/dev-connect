import { Card } from './Card';

export default {
  title: 'UI/Card',
  component: Card,
};

/** A basic card with default (md) padding and plain text content. */
export function Default() {
  return (
    <Card>
      <p className="text-gray-700">
        This is a simple card with default padding and styling.
      </p>
    </Card>
  );
}

/** Card with Header, Body, and Footer sub‑components. */
export function WithAllSections() {
  return (
    <Card padding="none">
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900">Card Title</h3>
      </Card.Header>
      <Card.Body>
        <p className="text-gray-700">
          This is the main body content of the card. It can hold any rich
          content you need.
        </p>
      </Card.Body>
      <Card.Footer>
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Save
          </button>
        </div>
      </Card.Footer>
    </Card>
  );
}

/** A hoverable card that gains extra shadow on hover. */
export function Hoverable() {
  return (
    <Card hoverable>
      <p className="text-gray-700">
        Hover over this card to see the shadow transition effect.
      </p>
    </Card>
  );
}

/** A card with padding set to "none" — useful when children handle their own spacing. */
export function NoPadding() {
  return (
    <Card padding="none">
      <img
        src="https://via.placeholder.com/600x200"
        alt="Placeholder"
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <div className="px-6 py-4">
        <h3 className="font-semibold text-gray-900">No Padding Card</h3>
        <p className="mt-1 text-sm text-gray-600">
          The card itself has no padding so the image can go edge‑to‑edge.
        </p>
      </div>
    </Card>
  );
}
