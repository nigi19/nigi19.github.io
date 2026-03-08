import { Beer } from '../types';

interface Props {
  beers: Beer[];
  onLog: (beer: Beer) => void;
}

export default function BeerResultsList({ beers, onLog }: Props) {
  if (beers.length === 0) {
    return (
      <div className="card" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        No beers found. Try a different search.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <table className="beer-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Brewery</th>
            <th>Style</th>
            <th>ABV</th>
            <th>Country</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {beers.map((beer) => (
            <tr key={beer.id}>
              <td><strong>{beer.name}</strong></td>
              <td>{beer.brewery}</td>
              <td>{beer.style}</td>
              <td>
                <span className="abv-badge">{beer.abv.toFixed(1)}%</span>
              </td>
              <td>{beer.country}</td>
              <td>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onLog(beer)}
                >
                  Log
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
