import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-youtube-player',
  imports: [NgIf],
  templateUrl: './youtube-player.component.html',
  styleUrl: './youtube-player.component.scss',
})
export class YoutubePlayerComponent {
  constructor(private sanitizer: DomSanitizer) {}

  full_url: SafeResourceUrl | null = null;

  @Input()
  set vid(vid: string) {
    this.full_url = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.youtube.com/embed/' + vid + '?modestbranding=1'
    );
  }
}
