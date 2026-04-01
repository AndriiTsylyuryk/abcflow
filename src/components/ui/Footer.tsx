import Link from "next/link";
import { APP_NAME } from "@/config/constants";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
        <span className="font-semibold text-brand-600">{APP_NAME}</span>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/terms" className="hover:text-gray-700">
            Terms &amp; Conditions
          </Link>
          <a href="mailto:andrii@abcflow.online" className="hover:text-gray-700">
            Support: andrii@abcflow.online
          </a>
        </div>
        <p>© {new Date().getFullYear()} ABCflow. All rights reserved.</p>
      </div>
    </footer>
  );
}
