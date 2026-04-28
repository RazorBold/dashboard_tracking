import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-page__content">
        <FileQuestion size={80} className="not-found-page__icon" />
        <h1 className="not-found-page__title">404</h1>
        <p className="not-found-page__subtitle">Page Not Found</p>
        <p className="not-found-page__desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/monitor/objects" className="not-found-page__link">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
