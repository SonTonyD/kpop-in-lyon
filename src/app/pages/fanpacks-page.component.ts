import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FanpackCampaign } from '../services/back-office.types';
import { FanpacksService } from '../services/fanpacks.service';

@Component({
  selector: 'app-fanpacks-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fanpacks-page.component.html',
  styleUrl: './fanpacks-page.component.css',
})
export class FanpacksPageComponent implements OnInit {
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly campaigns = signal<FanpackCampaign[]>([]);

  constructor(private readonly fanpacksService: FanpacksService) {}

  async ngOnInit(): Promise<void> {
    try {
      this.campaigns.set(await this.fanpacksService.getActiveCampaigns());
    } catch {
      this.error.set('Les fanpacks disponibles ne peuvent pas etre charges pour le moment.');
    } finally {
      this.loading.set(false);
    }
  }

  protected stockLabel(campaign: FanpackCampaign): string {
    const activeMembers = campaign.members.filter((member) => member.isActive);
    const totalStock = activeMembers.reduce((total, member) => total + member.stock, 0);

    if (totalStock === 0) {
      return 'Rupture de stock';
    }

    return `${totalStock} fanpacks disponibles`;
  }

  protected memberLabel(campaign: FanpackCampaign): string {
    const count = campaign.members.filter((member) => member.isActive).length;

    return `${count} membre${count > 1 ? 's' : ''}`;
  }

  protected formatPrice(value: number | null): string {
    if (value === null) {
      return 'Non configure';
    }

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
