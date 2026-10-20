export default function Requirements({ game }) {
  const { minimum, recommended, storageGb } = game.requirements;
  const rows = [
    ['OS', minimum.os, recommended.os],
    ['Processor', minimum.cpu, recommended.cpu],
    ['Graphics', minimum.gpu, recommended.gpu],
    ['Memory', `${minimum.ramGb} GB RAM`, `${recommended.ramGb} GB RAM`],
    ['Video memory', `${minimum.vramGb} GB`, `${recommended.vramGb} GB`],
    ['Storage', `${storageGb} GB`, `${storageGb} GB`],
  ];

  return (
    <table className="table">
      <thead>
        <tr>
          <th />
          <th>Minimum</th>
          <th>Recommended</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, min, rec]) => (
          <tr key={label}>
            <td>
              <b>{label}</b>
            </td>
            <td>{min || '-'}</td>
            <td>{rec || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
