import { memo } from "react";
type RecommendationView = "recommended" | "close" | "reach" | "all";

type RecommendationTabsProps = {
  recommendationView: RecommendationView;
  setRecommendationView: (view: RecommendationView) => void;
  recommendationCounts: Record<RecommendationView, number>;
};

const tabs: Array<{ key: RecommendationView; label: string }> = [
  { key: "recommended", label: "Best Matches" },
  { key: "close", label: "Close Matches" },
  { key: "reach", label: "Reach Roles" },
  { key: "all", label: "All Roles" },
];

function RecommendationTabs({ recommendationView, setRecommendationView, recommendationCounts }: RecommendationTabsProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tabs.map((item) => (
        <button
          key={item.key}
          onClick={() => setRecommendationView(item.key)}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            recommendationView === item.key ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {item.label} <span className="ml-1 opacity-75">{recommendationCounts[item.key]}</span>
        </button>
      ))}
    </div>
  );
}

export default memo(RecommendationTabs);


