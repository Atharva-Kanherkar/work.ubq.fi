import { grid } from "../the-grid";
import { authentication } from "./authentication";
import { fetchCachedIssues, fetchGitHubIssues, fetchIssuesFull } from "./fetch-github-issues";
import { sortingButtons } from "./sorting-buttons";

fetchGitHubIssues().catch((error) => console.error(error));
authentication();
sortingButtons();
grid(document.getElementById("grid") as HTMLElement);

const cachedIssues = fetchCachedIssues();

if (cachedIssues) {
  // const fullIssues = fetchCachedIssuesFull();

  // if (!fullIssues) {
  fetchIssuesFull(cachedIssues)
    .then((downloaded) => console.log(downloaded))
    .catch((error) => console.error(error));
  // } else {
  //   console.trace({ fullIssues });
  // }
}

// function fetchCachedIssuesFull() {
//   const cachedIssues = localStorage.getItem("githubIssuesFull");
//   if (cachedIssues) {
//     try {
//       return JSON.parse(cachedIssues);
//     } catch (error) {
//       console.error(error);
//     }
//   }
//   return null;
// }
