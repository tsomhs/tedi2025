import formatDate from "../../Utils/formatDate";
import styles from "./AuctionTable.module.css";

function AuctionTable({ auctions, onEdit, onDelete, onStart, onBids, onInfo }) {
  const now = new Date();
  return (
    <table className={styles.auctionTable}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Categories</th>
          <th>First Bid</th>
          <th>Current Price</th>
          <th>Buy Price</th>
          <th>Bids</th>
          <th>Start</th>
          <th>End</th>
          <th>Location</th>
          <th>Country</th>
          <th>Seller</th>
          <th>Description</th>
          <th className={styles.actionsHeader}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {auctions.map((item) => {
          const startDate = new Date(item.starts);
          const isPending = startDate.getTime() > now.getTime();
          const isActive = !isPending;

          return (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.categories.join(", ")}</td>
              <td>{item.firstBid}</td>
              <td>{item.currently}</td>
              <td>{item.buyPrice}</td>
              <td>{item.numberOfBids}</td>
              <td>{formatDate(item.starts)}</td>
              <td>{formatDate(item.ends)}</td>
              <td>{item.location}</td>
              <td>{item.country}</td>
              <td>
                {item.seller.userID} (Rating: {item.seller.rating})
              </td>
              <td>{item.description}</td>
              <td className={styles.actions}>
                <button className={styles.info} onClick={() => onInfo(item.id)}>
                  Info
                </button>

                {isPending && (
                  <>
                    <button
                      className={styles.start}
                      onClick={() => onStart(item.id)}
                    >
                      Start
                    </button>
                    {item.bids.length === 0 && (
                      <>
                        <button
                          className={styles.edit}
                          onClick={() => onEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className={styles.delete}
                          onClick={() => onDelete(item.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {item.bids.length > 0 && (
                      <button
                        className={styles.bids}
                        onClick={() => onBids(item.id)}
                      >
                        Bids
                      </button>
                    )}
                  </>
                )}

                {isActive && item.bids.length > 0 && (
                  <button
                    className={styles.bids}
                    onClick={() => onBids(item.id)}
                  >
                    Bids
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
export default AuctionTable;
