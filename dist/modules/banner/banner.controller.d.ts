import { BannerService, BannerPlacement } from './banner.service';
export declare class BannerController {
    private readonly bannerService;
    constructor(bannerService: BannerService);
    list(userId: number, role: string, schoolId: number, placement?: BannerPlacement): Promise<{
        success: boolean;
        data: any;
    }>;
    popup(userId: number, role: string, schoolId: number): Promise<{
        success: boolean;
        data: any;
    }>;
}
