import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dailymotion-player',
  imports: [NgIf],
  templateUrl: './dailymotion-player.component.html',
  styleUrl: './dailymotion-player.component.scss',
})
export class DailymotionPlayerComponent {
  constructor(private sanitizer: DomSanitizer) {}

  full_url: SafeResourceUrl | null = null;

  @Input()
  set vid(vid: string | null | undefined) {
    if (!vid) {
      this.full_url = null;
      return;
    }

    const embedUrl = this.getEmbedUrl(vid.trim());
    this.full_url = embedUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl)
      : null;
  }

  private getEmbedUrl(value: string): string | null {
    if (!value) {
      return null;
    }

    // If an already sanitized/embed URL is provided, trust it if it targets YouTube or Dailymotion.
    if (this.isAllowedEmbedUrl(value)) {
      return value;
    }

    const youtubeId = this.extractYoutubeId(value);
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}`;
    }

    const dailymotionId = this.extractDailymotionId(value);
    if (dailymotionId) {
      return `https://geo.dailymotion.com/player.html?video=${dailymotionId}&sharing-enable=false&loop=true`;
    }

    return null;
  }

  private isAllowedEmbedUrl(url: string): boolean {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
      const parsed = new URL(url, base);
      if (!parsed.protocol.startsWith('http')) {
        return false;
      }
      const host = parsed.hostname.toLowerCase();
      return (
        host.includes('youtube.com') ||
        host.includes('youtu.be') ||
        host.includes('dailymotion.com')
      );
    } catch {
      return false;
    }
  }

  private extractYoutubeId(value: string): string | null {
    const prefixedMatch = value.match(/^youtube:(?<id>[a-zA-Z0-9_-]{11})$/);
    if (prefixedMatch?.groups?.['id']) {
      return prefixedMatch.groups['id'];
    }

    const urlMatch = value.match(
      /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)(?<id>[a-zA-Z0-9_-]{11})/
    );
    if (urlMatch?.groups?.['id']) {
      return urlMatch.groups['id'];
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(value) ? value : null;
  }

  private extractDailymotionId(value: string): string | null {
    const prefixedMatch = value.match(/^dailymotion:(?<id>[a-zA-Z0-9]+)/);
    if (prefixedMatch?.groups?.['id']) {
      return prefixedMatch.groups['id'];
    }

    const urlMatch = value.match(
      /^(?:https?:\/\/)?(?:(?:www|geo)\.)?dailymotion\.com\/(?:embed\/video\/|video\/|player\.html\?video=)?(?<id>[a-zA-Z0-9]+)/
    );
    if (urlMatch?.groups?.['id']) {
      return urlMatch.groups['id'];
    }

    return /^[a-zA-Z0-9]+$/.test(value) ? value : null;
  }
}
