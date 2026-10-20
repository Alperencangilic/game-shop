import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { formatRelative } from '../utils/format.js';
import { Alert, Loading } from './Loading.jsx';
import { StarInput, Stars } from './Stars.jsx';

function ReviewForm({ gameId, existing, onSaved, onCancel }) {
  const toast = useToast();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please choose a rating.');
      return;
    }
    try {
      if (existing) await api.put(`/reviews/${existing.id}`, { rating, comment });
      else await api.post(`/games/${gameId}/reviews`, { rating, comment });
      toast.success(existing ? 'Review updated.' : 'Thanks for your review!');
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="card review-form" onSubmit={submit}>
      <b>{existing ? 'Edit your review' : 'Write a review'}</b>
      <StarInput value={rating} onChange={setRating} />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} placeholder="Your opinion (optional)" />
      {error && <p className="error-text">{error}</p>}
      <div className="buttons">
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function Reviews({ game, owned, onChanged }) {
  const { user, isCustomer, can } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const { data, loading, reload } = useApi(`/games/${game.id}/reviews`);
  const [editing, setEditing] = useState(false);

  if (loading && !data) return <Loading />;
  const reviews = data?.reviews ?? [];
  const summary = data?.summary ?? { count: 0, average: null };
  const mine = user ? reviews.find((r) => r.userId === user.id) : null;

  const changed = () => {
    setEditing(false);
    reload({ quiet: true });
    onChanged?.();
  };

  const remove = async (review) => {
    const own = review.userId === user.id;
    const ok = await confirm({ title: 'Delete review?', message: own ? 'Your review will be deleted.' : `Delete the review by ${review.userName}?`, confirmLabel: 'Delete', tone: 'danger' });
    if (!ok) return;
    try {
      await api.del(`/reviews/${review.id}`);
      toast.success('Review deleted.');
      changed();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <p>
        Average rating: <Stars value={summary.average} /> ({summary.count} reviews)
      </p>

      {!user && (
        <Alert type="info">
          <Link to="/login">Log in</Link> and buy this game to write a review.
        </Alert>
      )}
      {user && isCustomer && !owned && <Alert type="info">You can only review products you bought.</Alert>}
      {user && isCustomer && owned && !mine && <ReviewForm gameId={game.id} onSaved={changed} />}
      {mine && editing && <ReviewForm gameId={game.id} existing={mine} onSaved={changed} onCancel={() => setEditing(false)} />}

      {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
      {reviews.map((review) => {
        const own = user && review.userId === user.id;
        if (own && editing) return null;
        return (
          <div key={review.id} className="card review">
            <div>
              <b>{own ? 'You' : review.userName}</b> <Stars value={review.rating} />{' '}
              <span className="muted small">
                {formatRelative(review.updatedAt)}
                {review.edited && ' (edited)'}
              </span>
            </div>
            {review.comment && <p>{review.comment}</p>}
            {(own || can('reviews.moderate')) && (
              <div className="buttons">
                {own && (
                  <button type="button" className="btn-link" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                )}
                <button type="button" className="btn-link danger" onClick={() => remove(review)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
