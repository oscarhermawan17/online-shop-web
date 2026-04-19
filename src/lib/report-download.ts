import api from '@/lib/api';

const parseFilename = (disposition?: string): string | null => {
  if (!disposition) {
    return null;
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = disposition.match(/filename="?([^"]+)"?/i);
  return asciiMatch?.[1] ?? null;
};

export const downloadAdminReport = async (
  endpoint: string,
  params: Record<string, string | number> = {},
  fallbackFilename = 'report.xls',
): Promise<string> => {
  const response = await api.get(endpoint, {
    params,
    responseType: 'blob',
  });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const contentType = response.headers['content-type'] as string | undefined;
  const filename = parseFilename(disposition) || fallbackFilename;

  const blob = new Blob([response.data], {
    type: contentType || 'application/vnd.ms-excel',
  });

  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);

  return filename;
};
