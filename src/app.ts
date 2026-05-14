import type { Project } from "./types";
import { PROJECTS } from "./projects";

export class App {
  private listView: HTMLElement;
  private iframeView: HTMLElement;
  private iframe: HTMLIFrameElement;

  constructor(root: HTMLElement) {
    this.listView = this.buildList();

    this.iframe = document.createElement("iframe");
    this.iframe.className = "project-iframe";
    this.iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation",
    );

    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "back-btn";
    backBtn.textContent = "← Back";
    backBtn.addEventListener("click", () => this.back());

    this.iframeView = document.createElement("div");
    this.iframeView.className = "iframe-view hidden";
    this.iframeView.append(this.iframe, backBtn);

    root.append(this.listView, this.iframeView);
  }

  private buildList(): HTMLElement {
    const view = document.createElement("div");
    view.className = "list-view";

    const header = document.createElement("header");
    header.className = "app-header";
    const h1 = document.createElement("h1");
    h1.textContent = "⚡ Launcher";
    header.append(h1);

    const list = document.createElement("ul");
    list.className = "project-list";

    for (const project of PROJECTS) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "project-card";

      const nameEl = document.createElement("span");
      nameEl.className = "card-name";
      nameEl.textContent = project.name;

      const urlEl = document.createElement("span");
      urlEl.className = "card-url";
      urlEl.textContent = new URL(project.url).hostname;

      btn.append(nameEl, urlEl);
      btn.addEventListener("click", () => this.open(project));
      li.append(btn);
      list.append(li);
    }

    view.append(header, list);
    return view;
  }

  private open(project: Project): void {
    this.iframe.src = project.url;
    this.listView.classList.add("hidden");
    this.iframeView.classList.remove("hidden");
  }

  private back(): void {
    this.iframe.src = "";
    this.listView.classList.remove("hidden");
    this.iframeView.classList.add("hidden");
  }
}
