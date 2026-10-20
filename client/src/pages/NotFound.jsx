import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Loading.jsx';

export default function NotFound() {
  return (
    <EmptyState title="404 - Page not found" action={<Link to="/" className="btn btn-primary">Go to store</Link>}>
      This page does not exist.
    </EmptyState>
  );
}
