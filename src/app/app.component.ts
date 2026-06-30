import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ChatbotService } from './core/services/chatbot.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly chatbot = inject(ChatbotService);
  title = 'Vayo Solutions';

  ngOnInit(): void {
    void this.chatbot.init().catch((error) => {
      console.error('[Chatbot] No se pudo inicializar Botpress:', error);
    });
  }
}
