import { Link } from "react-router";
import { useUiStore } from "../app/store/useUiStore";

export default function Breadcrumbs() {
  const { breadcrumbs } = useUiStore();

  // No mostrar breadcrumbs si no hay elementos
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className="breadcrumbs sticky text-sm bg-base-100 z-30 font-semibold pb-4 invisible md:visible">
      <ul>
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={index}>
            {breadcrumb.href && index < breadcrumbs.length - 1 ? (
              <Link
                to={breadcrumb.href}
                className="text-primary hover:text-primary-focus flex items-center gap-1"
              >
                {breadcrumb.icon && <span>{breadcrumb.icon}</span>}
                {breadcrumb.label}
              </Link>
            ) : (
              <span className="flex items-center gap-1">
                {breadcrumb.icon && <span>{breadcrumb.icon}</span>}
                {breadcrumb.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
