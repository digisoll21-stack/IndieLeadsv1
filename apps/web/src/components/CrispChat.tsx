import { useEffect } from "react";

declare global {
    interface Window {
        $crisp: any;
        CRISP_WEBSITE_ID: string;
    }
}

export const CrispChat = () => {
    useEffect(() => {
        // 1. Load Crisp Script
        window.$crisp = [];
        window.CRISP_WEBSITE_ID = "YOUR_CRISP_WEBSITE_ID"; // ACTION: REPLACE THIS

        (function () {
            const d = document;
            const s = d.createElement("script");
            s.src = "https://client.crisp.chat/l.js";
            s.async = true;
            d.getElementsByTagName("head")[0].appendChild(s);
        })();

        // 2. Identify User (if logged in)
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (window.$crisp) {
                    window.$crisp.push(["set", "user:email", [user.email]]);
                    window.$crisp.push(["set", "user:nickname", [`${user.firstName} ${user.lastName}`]]);
                }
            } catch (e) {
                console.error("Failed to parse user for Crisp", e);
            }
        }
    }, []);

    return null;
};
