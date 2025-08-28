import formatDate from "../../Utils/formatDate";
import styles from "./AuctionTable.module.css";

function AuctionTable({ auctions, onEdit, onDelete, onStart, onInfo }) {
  const now = new Date();
  return (
    <table className={styles.auctionTable}>
      <thead>
        <tr>
          <th>Name</th>
          <th>First Bid</th>
          <th>Current Price</th>
          <th>Buy Price</th>
          <th>Bids</th>
          <th>Categories</th>
          <th>Start</th>
          <th>End</th>
          <th className={styles.actionsHeader}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {auctions.length > 0 ? (
          auctions.map((item) => {
            const startDate = new Date(item.starts);
            const isPending = startDate.getTime() > now.getTime();
            const isActive = !isPending;

            return (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.firstBid}</td>
                <td>{item.currently}</td>
                <td>{item.buyPrice}</td>
                <td>{item.numberOfBids}</td>
                <td>{item.categories.join(", ")}</td>
                <td>{formatDate(item.starts)}</td>
                <td>{formatDate(item.ends)}</td>
                <td className={styles.actions}>
                  <button
                    className={styles.info}
                    onClick={() => onInfo(item.id)}
                  >
                    Info
                  </button>

                  {isPending && (
                    <>
                      <button
                        className={styles.start}
                        onClick={() => onStart(item)}
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
                    </>
                  )}
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="9" className={styles.noAuctions}>
              No auctions available
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
export default AuctionTable;
