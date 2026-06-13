import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(private title: Title, private meta: Meta) {}

  setPage(title: string, description?: string, image?: string): void {
    this.title.setTitle(`${title} | VAYO Solutions`);

    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
    }

    this.meta.updateTag({ property: 'og:title', content: title });

    if (image) {
      this.meta.updateTag({ property: 'og:image', content: image });
    }
  }
}
