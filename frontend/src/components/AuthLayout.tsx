import { Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AuthLayout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{t("app.title")}</h1>
          <LanguageSwitcher />
        </div>
        <Outlet />
        <div className="text-center text-sm text-muted-foreground space-x-4">
          <Link to="/login" className="hover:underline">{t("auth.login")}</Link>
          <Link to="/register" className="hover:underline">{t("auth.register")}</Link>
        </div>
      </div>
    </div>
  );
}
