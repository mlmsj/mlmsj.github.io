import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CarFront,
  Code2,
  Megaphone,
  Palette,
  PenLine,
  Route,
  Scissors,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  SKILL_GROWTH_ROOT_IDS,
  getCategoryPath,
  getCategoryById,
  getChildCategories,
  type Category,
} from "./categories";
import {
  categoryPathBrowseLocation,
  resourceFilterLocation,
} from "./categoryRouting";

const boardIcons: Record<string, LucideIcon> = {
  "skill-ai-digital-tech": BrainCircuit,
  "skill-digital-creation-media": Palette,
  "skill-life-interests": Route,
};

const groupIcons: Record<string, LucideIcon> = {
  "skill-ai-knowledge": BrainCircuit,
  "skill-coding-development": Code2,
  "skill-photoshop-design": Palette,
  "skill-video-editing": Scissors,
  "skill-social-media": Megaphone,
  "skill-driving": CarFront,
  "skill-life-guides": Route,
  "skill-calligraphy-art": PenLine,
};

const countLabel = (count: number) => `${count} 份公开资料`;

function categoryLocation(categoryId: string) {
  const path = getCategoryPath(categoryId);
  return path.length > 0
    ? categoryPathBrowseLocation(path.map((category) => category.id))
    : null;
}

function stopAndOpen(
  event: React.MouseEvent<HTMLAnchorElement>,
  location: string,
  onOpen: (location: string) => void,
) {
  if (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  ) {
    event.preventDefault();
    onOpen(location);
  }
}

function CategoryBrowseLink({
  category,
  count,
  className,
  onOpen,
  children,
}: {
  category: Category;
  count: number;
  className: string;
  onOpen: (location: string) => void;
  children: React.ReactNode;
}) {
  const location = categoryLocation(category.id);
  if (!location) return null;
  return (
    <a
      className={className}
      href={location}
      onClick={(event) => stopAndOpen(event, location, onOpen)}
    >
      {children}
      <span className="skill-growth-count">{countLabel(count)}</span>
    </a>
  );
}

function ResourceCategoryLink({
  category,
  count,
  onOpen,
}: {
  category: Category;
  count: number;
  onOpen: (location: string) => void;
}) {
  const location = resourceFilterLocation(category.id);
  if (!location) return null;
  return (
    <a
      className="skill-growth-leaf"
      href={location}
      onClick={(event) => stopAndOpen(event, location, onOpen)}
    >
      <span>{category.name}</span>
      <span className="skill-growth-leaf-meta">
        <small>{countLabel(count)}</small>
        <ArrowUpRight size={15} aria-hidden="true" />
      </span>
    </a>
  );
}

export function SkillGrowthPage({
  counts = {},
  onHome,
  onOpenCategories,
  onOpenResources,
}: {
  counts?: Readonly<Record<string, number>>;
  onHome: () => void;
  onOpenCategories: (location: string) => void;
  onOpenResources: (location: string) => void;
}) {
  const boards = SKILL_GROWTH_ROOT_IDS.map((id) => getCategoryById(id)).filter(
    (category): category is Category => Boolean(category),
  );

  return (
    <section className="page-section skill-growth-page">
      <nav className="skill-growth-trail" aria-label="页面位置">
        <button type="button" onClick={onHome}>首页</button>
        <span aria-hidden="true">/</span>
        <span aria-current="page">技能成长</span>
      </nav>

      <header className="skill-growth-head">
        <p className="kicker">SKILL GROWTH</p>
        <h1>技能成长</h1>
        <p className="page-lead">
          按学习方向继续积累技能，从 AI 与数字科技走向创作、运营与生活兴趣。
        </p>
        <p className="skill-growth-honest-note" role="status">
          当前公开清单中的技能成长资料将按审核进度逐步开放；页面数量只统计真实公开资料。
        </p>
      </header>

      <div className="skill-growth-board-list">
        {boards.map((board) => {
          const BoardIcon = boardIcons[board.id] ?? Sparkles;
          const groups = getChildCategories(board.id);
          const isFeatured = board.id === "skill-ai-digital-tech";
          const boardLocation = categoryLocation(board.id);
          return (
            <section
              className={`skill-growth-board ${isFeatured ? "is-featured" : ""}`}
              key={board.id}
              aria-labelledby={`${board.id}-title`}
            >
              <div className="skill-growth-board-head">
                <div className="skill-growth-board-title">
                  <span className="skill-growth-board-icon" aria-hidden="true">
                    <BoardIcon size={22} />
                  </span>
                  <div>
                    <p className="skill-growth-board-index">{String(boards.indexOf(board) + 1).padStart(2, "0")}</p>
                    <h2 id={`${board.id}-title`}>{board.name}</h2>
                  </div>
                </div>
                <div className="skill-growth-board-summary">
                  <span>{countLabel(counts[board.id] ?? 0)}</span>
                  {boardLocation && (
                    <a
                      href={boardLocation}
                      onClick={(event) => stopAndOpen(event, boardLocation, onOpenCategories)}
                    >
                      浏览板块 <ArrowRight size={16} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>

              <div className="skill-growth-group-grid">
                {groups.map((group) => {
                  const GroupIcon = groupIcons[group.id] ?? Sparkles;
                  const leaves = getChildCategories(group.id);
                  return (
                    <article className="skill-growth-group" key={group.id}>
                      <CategoryBrowseLink
                        category={group}
                        count={counts[group.id] ?? 0}
                        className="skill-growth-group-head"
                        onOpen={onOpenCategories}
                      >
                        <span className="skill-growth-group-icon" aria-hidden="true">
                          <GroupIcon size={18} />
                        </span>
                        <strong>{group.name}</strong>
                        <ArrowUpRight className="skill-growth-group-arrow" size={16} aria-hidden="true" />
                      </CategoryBrowseLink>
                      <div className="skill-growth-leaf-list">
                        {leaves.map((leaf) => (
                          <ResourceCategoryLink
                            category={leaf}
                            count={counts[leaf.id] ?? 0}
                            onOpen={onOpenResources}
                            key={leaf.id}
                          />
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="skill-growth-future" aria-label="技能成长说明">
        <Sparkles size={18} aria-hidden="true" />
        <p>
          更多 AI 学习能力，正在准备中。当前页面只展示已登记的分类与真实公开状态，不提前承诺尚未开放的功能。
        </p>
      </section>
    </section>
  );
}
