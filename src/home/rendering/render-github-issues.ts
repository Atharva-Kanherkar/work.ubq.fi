import { marked } from "marked";
import { organizationImageCache, previewToFullMapping } from "../fetch-github/fetch-issues-full";
import { GitHubIssueWithNewFlag } from "../fetch-github/preview-to-full-mapping";
import { GitHubIssue } from "../github-types";
import { previewBodyInner, previewWrapper, titleAnchor, titleHeader } from "./render-preview-modal";
import { setupKeyboardNavigation } from "./setup-keyboard-navigation";

export function renderGitHubIssues(container: HTMLDivElement, issues: GitHubIssueWithNewFlag[]) {
  if (container.classList.contains("ready")) {
    container.classList.remove("ready");
    container.innerHTML = "";
  }
  const existingIssueIds = new Set(Array.from(container.querySelectorAll(".issue-element-inner")).map((element) => element.getAttribute("data-preview-id")));

  let delay = 0;
  const baseDelay = 1000 / 15; // Base delay in milliseconds

  for (const issue of issues) {
    if (!existingIssueIds.has(issue.id.toString())) {
      const issueWrapper = everyNewIssue({ issue, container });
      setTimeout(() => issueWrapper.classList.add("active"), delay);
      delay += baseDelay;
    }
  }
  container.classList.add("ready");
  // Call this function after the issues have been rendered
  setupKeyboardNavigation(container);
}

function everyNewIssue({ issue, container }: { issue: GitHubIssueWithNewFlag; container: HTMLDivElement }) {
  const issueWrapper = document.createElement("div");
  const issueElement = document.createElement("div");
  issueElement.setAttribute("data-preview-id", issue.id.toString());
  issueElement.classList.add("issue-element-inner");

  if (issue.isNew) {
    issueWrapper.classList.add("new-issue");
  }

  const urlPattern = /https:\/\/github\.com\/([^/]+)\/([^/]+)\//;
  const match = issue.body.match(urlPattern);
  const organizationName = match?.[1];
  if (!organizationName) {
    throw new Error("No organization name found");
  }
  const repositoryName = match?.[2];
  if (!repositoryName) {
    throw new Error("No repository name found");
  }
  const labels = parseAndGenerateLabels(issue);
  setUpIssueElement(issueElement, issue, organizationName, repositoryName, labels, match);
  issueWrapper.appendChild(issueElement);

  container.appendChild(issueWrapper);
  return issueWrapper;
}

function setUpIssueElement(
  issueElement: HTMLDivElement,
  issuePreview: GitHubIssueWithNewFlag,
  organizationName: string,
  repositoryName: string,
  labels: string[],
  match: RegExpMatchArray | null
) {
  let image = `<img />`;
  const orgCacheEntry = organizationImageCache.find((entry) => Object.prototype.hasOwnProperty.call(entry, organizationName));
  const avatarUrl = orgCacheEntry ? orgCacheEntry[organizationName] : null;
  if (avatarUrl) {
    image = `<img src="${avatarUrl}" />`;
  }

  issueElement.innerHTML = `
      <div class="info"><div class="title"><h3>${
        issuePreview.title
      }</h3></div><div class="partner"><p class="organization-name">${organizationName}</p><p class="repository-name">${repositoryName}</p></div></div><div class="labels">${labels.join(
        ""
      )}${image}</div>`;

  issueElement.addEventListener("click", function () {
    const issueWrapper = issueElement.parentElement;

    if (!issueWrapper) {
      throw new Error("No issue container found");
    }

    Array.from(issueWrapper.parentElement?.children || []).forEach((sibling) => {
      sibling.classList.remove("selected");
    });

    issueWrapper.classList.add("selected");

    const previewId = Number(this.getAttribute("data-preview-id"));
    console.trace({ mapping: previewToFullMapping, previewId });
    const full = previewToFullMapping.get(previewId);
    if (!full) {
      window.open(match?.input, "_blank");
    } else {
      previewIssue(issuePreview);
    }
  });
}

function parseAndGenerateLabels(issue: GitHubIssueWithNewFlag) {
  type LabelKey = "Pricing: " | "Time: " | "Priority: ";

  const labelOrder: Record<LabelKey, number> = { "Pricing: ": 1, "Time: ": 2, "Priority: ": 3 };

  issue.labels.sort((a, b) => {
    const matchA = a.name.match(/^(Pricing|Time|Priority): /)?.[0] as LabelKey | undefined;
    const matchB = b.name.match(/^(Pricing|Time|Priority): /)?.[0] as LabelKey | undefined;
    const orderA = matchA ? labelOrder[matchA] : 0;
    const orderB = matchB ? labelOrder[matchB] : 0;
    return orderA - orderB;
  });

  // Filter labels that begin with specific prefixes
  const filteredLabels = issue.labels.filter((label) => {
    return label.name.startsWith("Time: ") || label.name.startsWith("Pricing: ") || label.name.startsWith("Priority: ");
  });

  // Map the filtered labels to HTML elements
  const labels = filteredLabels.map((label) => {
    // Remove the prefix from the label name
    const name = label.name.replace(/(Time|Pricing|Priority): /, "");
    if (label.name.startsWith("Pricing: ")) {
      return `<label class="pricing">${name}</label>`;
    } else {
      return `<label class="label">${name}</label>`;
    }
  });
  return labels;
}

// Function to update and show the preview
function previewIssue(issuePreview: GitHubIssueWithNewFlag) {
  const issueFull = previewToFullMapping.get(issuePreview.id);

  if (!issueFull) {
    throw new Error("Issue not found");
  }

  displayIssue(issueFull);
}

export function displayIssue(issueFull: GitHubIssue) {
  // Update the title and body for the new issue
  titleHeader.textContent = issueFull.title;
  titleAnchor.href = issueFull.html_url;
  previewBodyInner.innerHTML = marked(issueFull.body) as string;

  // Show the preview
  previewWrapper.classList.add("active"); //  = 'block';
  document.body.classList.add("preview-active");
}
