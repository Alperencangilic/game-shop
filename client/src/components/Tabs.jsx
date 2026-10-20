export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" className={`tab ${tab.id === active ? 'active' : ''}`} onClick={() => onChange(tab.id)}>
          {tab.label}
          {tab.count !== undefined && ` (${tab.count})`}
        </button>
      ))}
    </div>
  );
}
