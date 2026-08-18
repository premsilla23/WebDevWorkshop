import BootLoader from "@/components/BootLoader";
import RouteTransition from "@/components/RouteTransition";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

export const metadata = {
    title: {
        default: "Coding Club BITS Pilani — WebDev Vertical",
        template: "%s · WebDev Vertical",
    },
    description:
        "Workshop material for the WebDev vertical of Coding Club, BITS Pilani. Learn frontend and backend by building, breaking and shipping.",
};

export const viewport = {
    themeColor: "#080b10",
    colorScheme: "dark",
};

/* Runs before first paint: if the intro has already played this session, mark
   the document so CSS hides the overlay immediately instead of flashing it. */
const BOOT_FLAG = `try{if(sessionStorage.getItem('cc:booted')==='1'){document.documentElement.dataset.booted='true'}}catch(e){}`;

export default function RootLayout({ children }) {
    return (
        <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: BOOT_FLAG }} />
            </head>
            <body>
                <BootLoader />
                <SiteNav />
                <RouteTransition>{children}</RouteTransition>
            </body>
        </html>
    );
}
