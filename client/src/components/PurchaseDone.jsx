import { Link } from 'react-router-dom';
import { formatMoney } from '../utils/format.js';
import DownloadButton from './DownloadButton.jsx';
import GameImage from './GameImage.jsx';
import Modal from './Modal.jsx';

// Shown after checkout: lets the customer download right away
export default function PurchaseDone({ order, onClose }) {
  return (
    <Modal
      title={`Order #${order.id} completed`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <Link to="/library" className="btn btn-primary" onClick={onClose}>
            Go to library
          </Link>
        </>
      }
    >
      <p className="alert alert-success">Payment successful. {formatMoney(order.totalCents)} was paid from your wallet.</p>
      <table className="table">
        <tbody>
          {order.entries.map((item) => (
            <tr key={item.entryId}>
              <td style={{ width: 90 }}>
                <GameImage game={item} className="thumb" />
              </td>
              <td>
                <b>{item.title}</b>
              </td>
              <td>
                <DownloadButton item={item} small />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
