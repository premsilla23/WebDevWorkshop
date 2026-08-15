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

export default function RootLayout({ children }) {
    return (
        <html lang="en" data-scroll-behavior="smooth">
            <body>{children}</body>
        </html>
    );
}
