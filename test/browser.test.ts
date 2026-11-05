import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { createPage, setup } from "@nuxt/test-utils/e2e";
import type { Page } from "playwright-core";

/** Creates a decodable image with the browser's real encoder instead of a binary fixture. */
async function imageFile(page: Page) {
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 120;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#f43f5e";
    context.fillRect(0, 0, 120, 120);
    return canvas.toDataURL("image/png").split(",")[1]!;
  });
  return { name: "rose.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") };
}

describe("native cropper UI", async () => {
  await setup({
    rootDir: fileURLToPath(new URL("./fixtures/browser", import.meta.url)),
    browser: true,
  });

  it("keeps host styles and provides a modal with keyboard dismissal and focus restoration", async () => {
    const page = await createPage("/");
    try {
      expect(await page.locator("h1").evaluate(el => getComputedStyle(el).fontSize)).toBe("32px");
      await page.locator("#open").click();
      const dialog = page.getByRole("dialog", { name: "Crop image" });
      await dialog.waitFor({ state: "visible" });
      expect(await dialog.evaluate(el => el instanceof HTMLDialogElement && el.matches(":modal"))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await page.waitForFunction(() => document.activeElement?.id === "open");
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
      await page.locator("#open").click();
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      expect(await page.locator("#cancellations").textContent()).toBe("1");
    }
    finally {
      await page.close();
    }
  });

  it("validates picked and dropped files and allows selecting the same file again", async () => {
    const page = await createPage("/");
    try {
      await page.getByTestId("dropzone").waitFor({ state: "visible" });
      expect(await page.getByTestId("dropzone").count()).toBe(1);
      const input = page.getByTestId("dropzone").locator("input[type=file]");
      expect(await input.count()).toBe(1);
      expect(await page.getByTestId("dropzone").getAttribute("class")).toContain("consumer-class");
      const image = { name: "image.png", mimeType: "image/png", buffer: Buffer.from("image") };
      // Keyboard activation must open the same native picker as clicking the label.
      const [chooser] = await Promise.all([page.waitForEvent("filechooser"), input.press("Enter")]);
      await chooser.setFiles(image);
      await expect.poll(() => page.locator("#selections").textContent(), { timeout: 2000 }).toBe("1");
      await input.setInputFiles(image);
      await expect.poll(() => page.locator("#selections").textContent(), { timeout: 2000 }).toBe("2");
      await input.setInputFiles([]);
      expect(await page.locator("#selections").textContent()).toBe("2");
      await input.setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(1025) });
      await expect.poll(() => page.locator("#error").textContent(), { timeout: 2000 }).toBe("file-too-large");
      // Dropped MIME types must reach our validation instead of being silently filtered out.
      await page.getByTestId("dropzone").evaluate((el) => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(["text"], "invalid.txt", { type: "text/plain" }));
        el.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
      });
      await expect.poll(() => page.locator("#error").textContent(), { timeout: 2000 }).toBe("invalid-file-type");
      await page.getByTestId("dropzone").evaluate((el) => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(["image"], "dropped.png", { type: "image/png" }));
        el.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
      });
      await expect.poll(() => page.locator("#selections").textContent()).toBe("3");
      await page.getByRole("checkbox").check();
      expect(await input.isDisabled()).toBe(true);
      await page.getByTestId("dropzone").evaluate((el) => {
        const transfer = new DataTransfer();
        transfer.items.add(new File(["image"], "ignored.png", { type: "image/png" }));
        el.dispatchEvent(new DragEvent("drop", { bubbles: true, dataTransfer: transfer }));
      });
      expect(await page.locator("#selections").textContent()).toBe("3");
    }
    finally {
      await page.close();
    }
  });

  it.each(["png", "jpeg", "webp"] as const)("exports %s at the requested dimensions and revokes its input URL", async (format) => {
    const page = await createPage(`/?format=${format}`);
    try {
      const image = await imageFile(page);
      await page.locator("#open").click();
      const dialog = page.getByRole("dialog", { name: "Crop image" });
      await dialog.locator("input[type=file]").setInputFiles(image);
      const save = dialog.getByRole("button", { name: "Save Crop", exact: true });
      await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>("dialog[open] .image-cropper-button--primary")?.disabled);
      const source = await dialog.locator("img").first().getAttribute("src");
      await save.click();
      await page.waitForFunction(() => Boolean(document.querySelector("#result")?.textContent));
      const result = JSON.parse((await page.locator("#result").textContent())!);
      expect(result).toMatchObject({ width: 80, height: 80, mimeType: `image/${format}`, fileType: `image/${format}` });
      expect(result.size).toBeGreaterThan(0);
      expect(result.dataUrl).toMatch(new RegExp(`^data:image/${format};base64,`));
      expect(result.coordinates.width).toBeGreaterThan(0);
      expect(source).toMatch(/^blob:/);
      expect(await page.evaluate(async (src) => {
        try {
          await fetch(src!);
          return false;
        }
        catch {
          return true;
        }
      }, source)).toBe(true);
      await dialog.waitFor({ state: "hidden" });
      await page.locator("#open").click();
      expect(await dialog.locator("input[type=file]").count()).toBe(1);
    }
    finally {
      await page.close();
    }
  });
  it("keeps rose styling on mobile, honors color modes and reduced motion, and has no runtime errors", async () => {
    const page = await createPage("/", { viewport: { width: 390, height: 844 }, colorScheme: "dark", reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    try {
      await page.locator("#open").click();
      const dialog = page.getByRole("dialog", { name: "Crop image", exact: true });
      await dialog.waitFor({ state: "visible" });
      expect(await dialog.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(24, 24, 27)");
      expect(await dialog.evaluate(el => getComputedStyle(el).transitionDuration)).toBe("0s");
      expect(await dialog.evaluate(el => getComputedStyle(el).getPropertyValue("--image-cropper-primary-600"))).toContain("58.6%");
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      await page.locator("html").evaluate(el => el.classList.add("light"));
      expect(await dialog.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(255, 255, 255)");
      await page.locator("html").evaluate(el => el.classList.replace("light", "dark"));
      expect(await dialog.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(24, 24, 27)");
      expect(errors).toEqual([]);
    }
    finally {
      await page.close();
    }
  });

  it("opens from an initial model, restores existing scroll styles, and releases locks on unmount", async () => {
    const page = await createPage("/?open=true");
    try {
      const dialog = page.getByRole("dialog", { name: "Crop image", exact: true });
      await dialog.waitFor({ state: "visible" });
      await dialog.locator("#nested-open").click();
      const nested = page.getByRole("dialog", { name: "Second cropper" });
      await nested.waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
      await nested.waitFor({ state: "hidden" });
      expect(await dialog.isVisible()).toBe(true);
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
      await page.locator("#unmount").evaluate(el => (el as HTMLButtonElement).click());
      await page.waitForFunction(() => document.documentElement.style.overflow === "");
      await page.locator("#unmount").click();
      await dialog.waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await page.evaluate(() => document.documentElement.style.setProperty("overflow", "clip", "important"));
      await page.locator("#open").click();
      await dialog.waitFor({ state: "visible" });
      await page.locator("#close").evaluate(el => (el as HTMLButtonElement).click());
      await dialog.waitFor({ state: "hidden" });
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("clip");
      expect(await page.evaluate(() => document.documentElement.style.getPropertyPriority("overflow"))).toBe("important");
    }
    finally {
      await page.close();
    }
  });

  it("reapplies supplied files on reopen and dismisses only a complete backdrop gesture", async () => {
    const page = await createPage("/");
    try {
      await page.locator("#source-file").setInputFiles(await imageFile(page));
      const dialog = page.getByRole("dialog", { name: "Crop image", exact: true });
      for (let attempt = 0; attempt < 2; attempt++) {
        await page.locator("#open").click();
        await expect.poll(() => dialog.getByRole("button", { name: "Save Crop", exact: true }).isEnabled()).toBe(true);
        const box = (await dialog.boundingBox())!;
        // Starting inside and ending on the backdrop is a drag, not a dismissal click.
        await page.mouse.move(box.x + 20, box.y + 20);
        await page.mouse.down();
        await page.mouse.move(1, 1);
        await page.mouse.up();
        expect(await dialog.evaluate(el => el.hasAttribute("open"))).toBe(true);
        await page.mouse.click(1, 1);
        await dialog.waitFor({ state: "hidden" });
      }
      expect(await page.locator("#cancellations").textContent()).toBe("0");
    }
    finally {
      await page.close();
    }
  });

  it("reports canvas export failures without closing the dialog", async () => {
    const page = await createPage("/");
    try {
      const image = await imageFile(page);
      await page.locator("#open").click();
      const dialog = page.getByRole("dialog", { name: "Crop image", exact: true });
      await dialog.locator("input[type=file]").setInputFiles(image);
      const save = dialog.getByRole("button", { name: "Save Crop", exact: true });
      await expect.poll(() => save.isEnabled()).toBe(true);
      // Exercise the real export error path with the browser's documented null-blob outcome.
      await page.evaluate(() => {
        HTMLCanvasElement.prototype.toBlob = function (callback) {
          callback(null);
        };
      });
      await save.click();
      await expect.poll(() => page.locator("#error").textContent()).toBe("export-error");
      expect(await dialog.getByRole("alert").textContent()).toContain("exporting");
      expect(await dialog.isVisible()).toBe(true);
      expect(await save.isEnabled()).toBe(true);
      expect(await page.locator("#confirmations").textContent()).toBe("0");
    }
    finally {
      await page.close();
    }
  });

  it("discards an export completed after cancellation and exposes a busy save button", async () => {
    const page = await createPage("/");
    try {
      const image = await imageFile(page);
      await page.locator("#open").click();
      const dialog = page.getByRole("dialog", { name: "Crop image", exact: true });
      await dialog.locator("input[type=file]").setInputFiles(image);
      const save = dialog.getByRole("button", { name: "Save Crop", exact: true });
      await expect.poll(() => save.isEnabled()).toBe(true);
      // Delay the actual encoder to reproduce cancel/reopen while an export is outstanding.
      await page.evaluate(() => {
        const encode = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
          setTimeout(() => {
            encode.call(this, (blob) => {
              callback(blob);
              document.documentElement.dataset.exportFinished = "true";
            }, type, quality);
          }, 400);
        };
      });
      await save.click();
      expect(await save.isDisabled()).toBe(true);
      expect(await save.getAttribute("aria-busy")).toBe("true");
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      await page.locator("#open").click();
      await page.waitForFunction(() => document.documentElement.dataset.exportFinished === "true");
      expect(await dialog.isVisible()).toBe(true);
      expect(await page.locator("#confirmations").textContent()).toBe("0");
      expect(await dialog.locator("input[type=file]").count()).toBe(1);
    }
    finally {
      await page.close();
    }
  });
});
