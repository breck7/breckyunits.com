// 404-handler.js
document.addEventListener("DOMContentLoaded", async function () {
    const currentUrl = window.location.href;
    const suggestionLink = document.getElementById("suggestionLink");

    // Function to calculate the Levenshtein distance between two strings
    function levenshteinDistance(a, b) {
        const m = a.length;
        const n = b.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) {
            dp[i][0] = i;
        }

        for (let j = 0; j <= n; j++) {
            dp[0][j] = j;
        }

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost,
                );
            }
        }

        return dp[m][n];
    }

    try {
        const response = await fetch("/sitemap.txt");
        const sitemap = await response.text();
        const urls = sitemap.split("\n");

        let closestMatch = null;
        let minDistance = Infinity;

        urls.forEach((url) => {
            const trimmedUrl = url.trim();
            if (trimmedUrl) {
                const distance = levenshteinDistance(currentUrl, trimmedUrl);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestMatch = trimmedUrl;
                }
            }
        });

        console.log(minDistance);

        if (closestMatch)
            suggestionLink.innerHTML = `Maybe the url you want is<br><a href="${closestMatch}">${closestMatch}</a>?`;
        else
            suggestionLink.parentElement.textContent =
                "No similar pages found.";
    } catch (error) {
        console.error("Failed to fetch the sitemap:", error);
        suggestionLink.parentElement.textContent =
            "Error checking for similar pages.";
    }
});
