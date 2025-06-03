export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function normalizeSocialMedia(socialMediaArray: { platform: string; url: string }[]): { [key: string]: string } {
  return socialMediaArray.reduce((acc: { [key: string]: string }, item: { platform: string; url: string }) => {
    switch (item.platform) {
      case 'instagram':
        acc['instagramUrl'] = item.url;
        break;
      case 'facebook':
        acc['facebookUrl'] = item.url;
        break;
      case 'linkedin':
        acc['linkedinUrl'] = item.url;
        break;
      case 'x':
        acc['xUrl'] = item.url;
        break;
      case 'tiktok':
        acc['tiktokUrl'] = item.url;
        break;
    }
    return acc;
  }, {});
}
