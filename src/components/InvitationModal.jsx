import { useState, useEffect, useRef } from 'react';
import { X, Copy, Mail, MessageCircle, Download, QrCode, Check, Share2 } from 'lucide-react';
import QRCode from 'qrcode';

const InvitationModal = ({
  isOpen,
  onClose,
  invitationData,
  onSendEmail
}) => {
  const [selectedMethod, setSelectedMethod] = useState('email');
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef(null);

  // Generate invitation link
  const getInvitationLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?invite=${invitationData.token}&type=${invitationData.role}`;
  };

  // Generate QR Code
  useEffect(() => {
    if (isOpen && invitationData) {
      generateQRCode();
    }
  }, [isOpen, invitationData]);

  const generateQRCode = async () => {
    try {
      const inviteUrl = getInvitationLink();
      const url = await QRCode.toDataURL(inviteUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#003366',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getInvitationLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Failed to copy link. Please try again.');
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `Hello ${invitationData.name}!\n\n` +
      `You've been invited to join Nyumbanii as a ${invitationData.role === 'property_manager' ? 'Property Manager' : invitationData.role === 'maintenance' ? 'Maintenance Staff' : 'Tenant'}.\n\n` +
      `Click the link below to complete your registration:\n` +
      `${getInvitationLink()}\n\n` +
      `Welcome aboard!`
    );

    // For mobile, use WhatsApp app link, for desktop use web.whatsapp.com
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const whatsappUrl = isMobile
      ? `whatsapp://send?phone=${invitationData.phone}&text=${message}`
      : `https://web.whatsapp.com/send?phone=${invitationData.phone}&text=${message}`;

    window.open(whatsappUrl, '_blank');
  };

  // Download invitation card
  const handleDownloadCard = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas size (A5 size in pixels at 150 DPI)
      canvas.width = 874;
      canvas.height = 1240;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#003366');
      gradient.addColorStop(1, '#0055AA');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // White card background
      ctx.fillStyle = '#FFFFFF';
      ctx.roundRect(40, 100, canvas.width - 80, canvas.height - 200, 20);
      ctx.fill();

      // Header decoration
      ctx.fillStyle = '#003366';
      ctx.roundRect(40, 100, canvas.width - 80, 150, [20, 20, 0, 0]);
      ctx.fill();

      // Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('You\'re Invited!', canvas.width / 2, 180);

      // Subtitle
      ctx.font = '24px Arial';
      ctx.fillText('Join Nyumbanii', canvas.width / 2, 220);

      // Body content
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('Dear ' + invitationData.name + ',', 80, 330);

      ctx.font = '20px Arial';
      ctx.fillStyle = '#555555';
      const roleText = invitationData.role === 'property_manager'
        ? 'Property Manager'
        : invitationData.role === 'maintenance'
        ? 'Maintenance Staff'
        : 'Tenant';

      wrapText(ctx, `You have been invited to join as a ${roleText}.`, 80, 380, canvas.width - 160, 30);
      wrapText(ctx, 'Scan the QR code below or use the invitation link to complete your registration.', 80, 450, canvas.width - 160, 30);

      // QR Code
      if (qrCodeUrl) {
        const qrImage = new Image();
        qrImage.src = qrCodeUrl;
        await new Promise((resolve) => {
          qrImage.onload = () => {
            const qrSize = 250;
            const qrX = (canvas.width - qrSize) / 2;
            const qrY = 530;

            // QR code background
            ctx.fillStyle = '#F3F4F6';
            ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 10);
            ctx.fill();

            ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
            resolve();
          };
        });
      }

      // Contact info
      ctx.fillStyle = '#666666';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Email: ' + invitationData.email, canvas.width / 2, 840);
      ctx.fillText('Phone: ' + invitationData.phone, canvas.width / 2, 870);

      // Footer
      ctx.fillStyle = '#999999';
      ctx.font = 'italic 16px Arial';
      ctx.fillText('Powered by Nyumbanii - Property Management Made Easy', canvas.width / 2, 980);

      // Decorative elements
      ctx.strokeStyle = '#003366';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, 900);
      ctx.lineTo(canvas.width - 80, 900);
      ctx.stroke();

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `invitation-${invitationData.name.replace(/\s+/g, '-')}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setDownloading(false);
      });

    } catch (error) {
      console.error('Error generating invitation card:', error);
      alert('Failed to generate invitation card. Please try again.');
      setDownloading(false);
    }
  };

  // Helper function to wrap text
  const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, currentY);
  };

  // Send email invitation
  const handleSendEmail = () => {
    onSendEmail();
  };

  if (!isOpen || !invitationData) return null;

  const invitationMethods = [
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      description: 'Send automated email invitation',
      color: 'blue',
      action: handleSendEmail
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      description: 'Share via WhatsApp',
      color: 'green',
      action: handleWhatsAppShare
    },
    {
      id: 'copy',
      name: 'Copy Link',
      icon: Copy,
      description: 'Copy link to share manually',
      color: 'purple',
      action: handleCopyLink
    },
    {
      id: 'qrcode',
      name: 'QR Code',
      icon: QrCode,
      description: 'Show QR code for scanning',
      color: 'indigo',
      action: () => setSelectedMethod('qrcode')
    },
    {
      id: 'download',
      name: 'Download Card',
      icon: Download,
      description: 'Download invitation card',
      color: 'orange',
      action: handleDownloadCard
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#003366] to-[#0055AA] text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Send Invitation</h2>
            <p className="text-blue-100 mt-1">Choose how to send the invitation to {invitationData.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Invitation Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Invitation Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium text-gray-900 dark:text-white">{invitationData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium text-gray-900 dark:text-white">{invitationData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                <span className="font-medium text-gray-900 dark:text-white">{invitationData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Role:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {invitationData.role === 'property_manager' ? 'Property Manager' :
                   invitationData.role === 'maintenance' ? 'Maintenance Staff' :
                   invitationData.role}
                </span>
              </div>
            </div>
          </div>

          {/* Invitation Methods */}
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Choose Invitation Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {invitationMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={method.action}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-105 text-left ${
                    selectedMethod === method.id
                      ? `border-${method.color}-500 bg-${method.color}-50 dark:bg-${method.color}-900/20`
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-${method.color}-100 dark:bg-${method.color}-900/40`}>
                      <Icon className={`w-6 h-6 text-${method.color}-600 dark:text-${method.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {method.name}
                        {method.id === 'copy' && copied && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {method.description}
                      </p>
                      {method.id === 'copy' && copied && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">
                          Copied to clipboard!
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* QR Code Display */}
          {selectedMethod === 'qrcode' && qrCodeUrl && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 text-center">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Scan QR Code to Register
              </h4>
              <div className="inline-block p-4 bg-white rounded-lg shadow-md">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Ask {invitationData.name} to scan this QR code with their phone camera
              </p>
            </div>
          )}

          {/* Invitation Link */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Invitation Link</h4>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <code className="text-sm text-gray-700 dark:text-gray-300 break-all">
                    {getInvitationLink()}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">💡 Tips</h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• <strong>Email</strong>: Automatic and professional, but check spam folder</li>
              <li>• <strong>WhatsApp</strong>: Instant delivery, 99% reach in Kenya</li>
              <li>• <strong>Copy Link</strong>: Share via any messaging app you prefer</li>
              <li>• <strong>QR Code</strong>: Great for in-person meetings</li>
              <li>• <strong>Download Card</strong>: Share as an image, looks professional</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
          >
            Close
          </button>
          <button
            onClick={handleSendEmail}
            className="flex-1 px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-medium flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitationModal;
