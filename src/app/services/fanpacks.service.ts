import { Injectable } from '@angular/core';
import {
  FanpackCampaign,
  FanpackCampaignPayload,
  FanpackMember,
  FanpackMemberPayload,
  FanpackOrder,
  FanpackOrderPayload,
  FanpackOrderStatus,
  FanpackRecoveryMethod,
  FanpackSocialPlatform,
} from './back-office.types';
import { SupabaseService } from './supabase.service';

const PAYMENT_PROOFS_BUCKET = 'fanpack-payment-proofs';
const FANPACK_BANNERS_BUCKET = 'fanpack-banners';

interface FanpackMemberRow {
  id: string;
  campaign_id: string;
  name: string;
  stock: number;
  max_per_order: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface FanpackCampaignRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pack_content: string;
  banner_image: string | null;
  banner_image_path: string | null;
  unit_price: number | string;
  complete_pack_price: number | string | null;
  is_active: boolean;
  created_at: string;
  fanpack_members?: FanpackMemberRow[];
}

interface FanpackOrderItemRow {
  id: string;
  order_id: string;
  member_id: string | null;
  member_name: string;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
  is_complete_pack: boolean;
}

interface FanpackOrderRow {
  id: string;
  campaign_id: string;
  campaign_name: string;
  customer_email: string;
  customer_full_name: string;
  social_platform: FanpackSocialPlatform;
  social_username: string;
  recovery_method: FanpackRecoveryMethod;
  postal_address: string | null;
  proof_path: string;
  total_amount: number | string;
  status: FanpackOrderStatus;
  created_at: string;
  fanpack_order_items?: FanpackOrderItemRow[];
}

@Injectable({ providedIn: 'root' })
export class FanpacksService {
  constructor(private readonly supabase: SupabaseService) {}

  async getPublicCampaign(slug: string): Promise<FanpackCampaign | null> {
    const { data, error } = await this.supabase.client
      .from('fanpack_campaigns')
      .select('*, fanpack_members(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .order('display_order', { referencedTable: 'fanpack_members', ascending: true })
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapCampaign(data) : null;
  }

  async getCampaigns(): Promise<FanpackCampaign[]> {
    const { data, error } = await this.supabase.client
      .from('fanpack_campaigns')
      .select('*, fanpack_members(*)')
      .order('created_at', { ascending: false })
      .order('display_order', { referencedTable: 'fanpack_members', ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapCampaign);
  }

  async getActiveCampaigns(): Promise<FanpackCampaign[]> {
    const { data, error } = await this.supabase.client
      .from('fanpack_campaigns')
      .select('*, fanpack_members(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .order('display_order', { referencedTable: 'fanpack_members', ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapCampaign);
  }

  async createCampaign(payload: FanpackCampaignPayload): Promise<FanpackCampaign> {
    const { data, error } = await this.supabase.client
      .from('fanpack_campaigns')
      .insert(toCampaignRowPayload(payload))
      .select('*, fanpack_members(*)')
      .single();

    if (error) {
      throw error;
    }

    return mapCampaign(data);
  }

  async updateCampaign(id: string, payload: FanpackCampaignPayload): Promise<FanpackCampaign> {
    const { data, error } = await this.supabase.client
      .from('fanpack_campaigns')
      .update(toCampaignRowPayload(payload))
      .eq('id', id)
      .select('*, fanpack_members(*)')
      .single();

    if (error) {
      throw error;
    }

    return mapCampaign(data);
  }

  async deleteCampaign(id: string): Promise<void> {
    const campaigns = await this.getCampaigns();
    const campaign = campaigns.find((item) => item.id === id) ?? null;
    const { error } = await this.supabase.client.from('fanpack_campaigns').delete().eq('id', id);

    if (error) {
      throw error;
    }

    if (campaign?.bannerImagePath) {
      await this.deleteBanner(campaign.bannerImagePath);
    }
  }

  async createMember(campaignId: string, payload: FanpackMemberPayload): Promise<FanpackMember> {
    const { data, error } = await this.supabase.client
      .from('fanpack_members')
      .insert({ ...toMemberRowPayload(payload), campaign_id: campaignId })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapMember(data);
  }

  async updateMember(id: string, payload: FanpackMemberPayload): Promise<FanpackMember> {
    const { data, error } = await this.supabase.client
      .from('fanpack_members')
      .update(toMemberRowPayload(payload))
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapMember(data);
  }

  async deleteMember(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('fanpack_members').delete().eq('id', id);

    if (error) {
      throw error;
    }
  }

  async getOrders(): Promise<FanpackOrder[]> {
    const { data, error } = await this.supabase.client
      .from('fanpack_orders')
      .select('*, fanpack_order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map(mapOrder);
  }

  async submitOrder(payload: FanpackOrderPayload): Promise<void> {
    const { error } = await this.supabase.client.rpc('submit_fanpack_order', {
      p_campaign_id: payload.campaignId,
      p_customer_email: payload.customerEmail,
      p_customer_full_name: payload.customerFullName,
      p_social_platform: payload.socialPlatform,
      p_social_username: payload.socialUsername,
      p_recovery_method: payload.recoveryMethod,
      p_postal_address: payload.postalAddress,
      p_proof_path: payload.proofPath,
      p_complete_pack_quantity: payload.completePackQuantity,
      p_member_quantities: payload.memberQuantities.map((item) => ({
        member_id: item.memberId,
        quantity: item.quantity,
      })),
    });

    if (error) {
      throw error;
    }
  }

  async uploadPaymentProof(file: File, campaignId: string): Promise<string> {
    const proofPath = `${campaignId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await this.supabase.client.storage
      .from(PAYMENT_PROOFS_BUCKET)
      .upload(proofPath, file, {
        cacheControl: '31536000',
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return proofPath;
  }

  async createProofSignedUrl(proofPath: string): Promise<string> {
    const { data, error } = await this.supabase.client.storage
      .from(PAYMENT_PROOFS_BUCKET)
      .createSignedUrl(proofPath, 60 * 5);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  }

  async uploadBanner(
    file: File,
    campaignId: string,
  ): Promise<{ bannerImage: string; bannerImagePath: string }> {
    const bannerImagePath = `${campaignId}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await this.supabase.client.storage
      .from(FANPACK_BANNERS_BUCKET)
      .upload(bannerImagePath, file, {
        cacheControl: '31536000',
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data } = this.supabase.client.storage
      .from(FANPACK_BANNERS_BUCKET)
      .getPublicUrl(bannerImagePath);

    return {
      bannerImage: data.publicUrl,
      bannerImagePath,
    };
  }

  async deleteBanner(bannerImagePath: string): Promise<void> {
    const { error } = await this.supabase.client.storage
      .from(FANPACK_BANNERS_BUCKET)
      .remove([bannerImagePath]);

    if (error) {
      console.warn('Fanpack banner could not be deleted from storage.', error);
    }
  }

  async updateOrderStatus(
    order: FanpackOrder,
    status: FanpackOrderStatus,
  ): Promise<{ order: FanpackOrder; emailSent: boolean; emailError: string | null }> {
    const { data, error } = await this.supabase.client
      .from('fanpack_orders')
      .update({ status })
      .eq('id', order.id)
      .select('*, fanpack_order_items(*)')
      .single();

    if (error) {
      throw error;
    }

    const updatedOrder = mapOrder(data);

    if (status === 'processing' && order.status !== 'processing') {
      const { data, error: emailError } = await this.supabase.client.functions.invoke<{
        emailSent?: boolean;
        resendId?: string;
        error?: string;
        detail?: string;
        resendStatus?: number;
      }>(
        'send-fanpack-status-email',
        { body: { orderId: order.id } },
      );

      if (emailError) {
        return { order: updatedOrder, emailSent: false, emailError: getErrorMessage(emailError) };
      }

      if (data?.emailSent === false) {
        return {
          order: updatedOrder,
          emailSent: false,
          emailError: formatEmailFunctionError(data.error, data.detail, data.resendStatus),
        };
      }

      if (data?.emailSent === true && !data.resendId) {
        return {
          order: updatedOrder,
          emailSent: false,
          emailError: 'La fonction a repondu sans identifiant Resend.',
        };
      }
    }

    return { order: updatedOrder, emailSent: true, emailError: null };
  }
}

export function calculateFanpackTotal(
  campaign: Pick<FanpackCampaign, 'unitPrice' | 'completePackPrice'>,
  members: Pick<FanpackMember, 'id'>[],
  memberQuantities: Record<string, number>,
  completePackQuantity: number,
): number {
  const memberTotal = members.reduce((total, member) => {
    return total + Math.max(0, Math.trunc(memberQuantities[member.id] ?? 0)) * campaign.unitPrice;
  }, 0);
  const completePackTotal =
    Math.max(0, Math.trunc(completePackQuantity)) * (campaign.completePackPrice ?? 0);

  return roundMoney(memberTotal + completePackTotal);
}

export function getCompletePackMaxQuantity(members: Pick<FanpackMember, 'stock' | 'isActive'>[]): number {
  const activeStocks = members.filter((member) => member.isActive).map((member) => member.stock);

  return activeStocks.length ? Math.min(...activeStocks) : 0;
}

function mapCampaign(row: FanpackCampaignRow): FanpackCampaign {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    packContent: row.pack_content,
    bannerImage: row.banner_image ?? null,
    bannerImagePath: row.banner_image_path ?? null,
    unitPrice: Number(row.unit_price),
    completePackPrice: row.complete_pack_price === null ? null : Number(row.complete_pack_price),
    isActive: row.is_active,
    createdAt: row.created_at,
    members: (row.fanpack_members ?? []).map(mapMember).sort((a, b) => a.displayOrder - b.displayOrder),
  };
}

function mapMember(row: FanpackMemberRow): FanpackMember {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    stock: row.stock,
    maxPerOrder: row.max_per_order,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapOrder(row: FanpackOrderRow): FanpackOrder {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    campaignName: row.campaign_name,
    customerEmail: row.customer_email,
    customerFullName: row.customer_full_name,
    socialPlatform: row.social_platform,
    socialUsername: row.social_username,
    recoveryMethod: row.recovery_method,
    postalAddress: row.postal_address,
    proofPath: row.proof_path,
    totalAmount: Number(row.total_amount),
    status: row.status,
    createdAt: row.created_at,
    items: (row.fanpack_order_items ?? []).map((item) => ({
      id: item.id,
      orderId: item.order_id,
      memberId: item.member_id,
      memberName: item.member_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
      isCompletePack: item.is_complete_pack,
    })),
  };
}

function toCampaignRowPayload(payload: FanpackCampaignPayload) {
  return {
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    pack_content: payload.packContent,
    banner_image: payload.bannerImage,
    banner_image_path: payload.bannerImagePath,
    unit_price: payload.unitPrice,
    complete_pack_price: payload.completePackPrice,
    is_active: payload.isActive,
  };
}

function toMemberRowPayload(payload: FanpackMemberPayload) {
  return {
    name: payload.name,
    stock: payload.stock,
    max_per_order: payload.maxPerOrder,
    display_order: payload.displayOrder,
    is_active: payload.isActive,
  };
}

function safeFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${baseName || 'preuve'}.${extension}`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatEmailFunctionError(
  error: string | undefined,
  detail: string | undefined,
  status: number | undefined,
): string {
  const statusPrefix = status ? `Resend ${status}` : 'Resend';
  const message = detail || error || 'Erreur inconnue';

  return `${statusPrefix}: ${message}`;
}
