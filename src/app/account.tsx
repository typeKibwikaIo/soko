import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Page } from '@/components/Page';
import { UploadPreview, type UploadPreviewState } from '@/components/UploadPreview';
import { Button, Container, Field, Loading, useResponsive } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  assetUrl,
  createAddress,
  deleteAddress,
  getProfile,
  isBackendConfigured,
  listAddresses,
  requestPhoneOtp,
  resendVerificationEmail,
  submitVendorVerification,
  updateProfile,
  uploadFile,
  verifyPhoneOtp,
  type Address,
  type BackendUser,
} from '@/lib/backend';
import { colors, font } from '@/lib/theme';

const ROLE_LABELS: Record<string, string> = { BUYER: 'Buyer', VENDOR: 'Vendor', ADMIN: 'Admin' };
const VERIFY_LABELS: Record<string, string> = {
  UNVERIFIED: 'Not verified',
  PENDING: 'Verification pending',
  VERIFIED: 'Verified',
  REJECTED: 'Verification rejected',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[font.h3, { marginBottom: 4 }]}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({ label, tone = 'default' }: { label: string; tone?: 'default' | 'primary' | 'success' | 'warn' }) {
  const bg = tone === 'primary' ? colors.primary : tone === 'success' ? colors.success : tone === 'warn' ? '#B7791F' : colors.soft;
  const fg = tone === 'default' ? colors.muted : '#fff';
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[font.small, { color: fg, fontWeight: '600', fontSize: 12 }]}>{label}</Text>
    </View>
  );
}

/** LinkedIn-style verified badge next to a name/label. */
function VerifiedBadge({ verified, label }: { verified: boolean; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={verified ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={verified ? colors.primary : colors.subtle} />
      <Text style={[font.small, { color: verified ? colors.primary : colors.muted, fontSize: 12, fontWeight: verified ? '600' : '400' }]}>
        {label}
      </Text>
    </View>
  );
}

export default function Account() {
  const { user, profile, roles, isAdmin, loading, signOut } = useAuth();
  const { isWide } = useResponsive();

  const [me, setMe] = useState<BackendUser | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addr, setAddr] = useState({ fullName: '', phone: '', addressLine1: '', city: '', isDefault: false });

  // Phone OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);

  // Identity verification state
  const [idNumber, setIdNumber] = useState('');
  const [dob, setDob] = useState('');
  const [idDoc, setIdDoc] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [preview, setPreview] = useState<UploadPreviewState | null>(null);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isBackendConfigured) return;
    try {
      const [u, addrs] = await Promise.all([getProfile(), listAddresses()]);
      setMe(u);
      setAddresses(addrs);
      setFirstName(u.firstName);
      setLastName(u.lastName);
      setPhone(u.phone ?? '');
      setIdNumber(u.vendorProfile?.idNumber ?? '');
      setDob(u.vendorProfile?.dateOfBirth ? u.vendorProfile.dateOfBirth.slice(0, 10) : '');
      setIdDoc(u.vendorProfile?.idDocumentFrontUrl ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading) return <Page><Loading /></Page>;
  if (!user) return <Redirect href="/login?next=/account" />;

  const displayName = me ? `${me.firstName} ${me.lastName}`.trim() : profile?.displayName || user.displayName || 'there';
  const displayRoles = roles.length ? roles : profile?.role === 'admin' ? ['ADMIN'] : ['BUYER'];
  const avatarUri = localAvatar ?? assetUrl(me?.avatarUrl);
  const initial = (displayName || '?').trim().charAt(0).toUpperCase();
  const vendor = me?.vendorProfile ?? null;

  const flash = (msg: string) => {
    setNotice(msg);
    setError(null);
    setTimeout(() => setNotice(null), 4000);
  };

  // Instagram-style: pick → upload → avatar updates instantly, no preview.
  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    setAvatarBusy(true);
    setError(null);
    setLocalAvatar(asset.uri); // instant local preview while uploading
    try {
      const url = await uploadFile(asset.uri, asset.mimeType ?? 'image/jpeg');
      const u = await updateProfile({ avatarUrl: url });
      setMe(u);
      setLocalAvatar(null);
      flash('Photo updated.');
    } catch (e) {
      setLocalAvatar(null);
      setError(e instanceof Error ? e.message : 'Could not upload photo');
    } finally {
      setAvatarBusy(false);
    }
  };

  const saveProfile = async () => {
    setError(null);
    setSaving(true);
    try {
      const u = await updateProfile({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || null });
      setMe(u);
      flash('Profile updated.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const sendOtp = async () => {
    setOtpBusy(true);
    setError(null);
    try {
      await requestPhoneOtp();
      setOtpSent(true);
      flash('Verification code sent to your phone.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send code');
    } finally {
      setOtpBusy(false);
    }
  };

  const confirmOtp = async () => {
    setOtpBusy(true);
    setError(null);
    try {
      await verifyPhoneOtp(otpCode.trim());
      setOtpSent(false);
      setOtpCode('');
      await load();
      flash('Phone number verified.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Incorrect code');
    } finally {
      setOtpBusy(false);
    }
  };

  const resendEmail = async () => {
    setError(null);
    try {
      await resendVerificationEmail();
      flash('Verification email sent — check your inbox.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend email');
    }
  };

  const pickIdDoc = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    setError(null);
    setPreview({ uri: asset.uri, title: 'ID document', status: 'uploading' });
    try {
      const url = await uploadFile(asset.uri, asset.mimeType ?? 'image/jpeg');
      setIdDoc(url);
      setPreview({ uri: assetUrl(url) ?? asset.uri, title: 'ID document', status: 'done' });
    } catch (e) {
      setPreview({ uri: asset.uri, title: 'ID document', status: 'error', message: e instanceof Error ? e.message : 'Upload failed' });
    }
  };

  const submitVerification = async () => {
    setError(null);
    if (!idNumber.trim()) return setError('Enter your ID number.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return setError('Date of birth must be YYYY-MM-DD.');
    if (!idDoc) return setError('Upload a photo of your ID document.');
    setVerifyBusy(true);
    try {
      await submitVendorVerification({
        idNumber: idNumber.trim(),
        dateOfBirth: dob,
        idDocumentUrl: idDoc,
      });
      await load();
      flash('Documents submitted — verification pending review.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit verification');
    } finally {
      setVerifyBusy(false);
    }
  };

  const saveAddress = async () => {
    setError(null);
    try {
      const created = await createAddress({
        fullName: addr.fullName.trim(),
        phone: addr.phone.trim(),
        addressLine1: addr.addressLine1.trim(),
        city: addr.city.trim(),
        country: 'DRC',
        isDefault: addr.isDefault,
      });
      setAddresses((prev) => [created, ...prev.map((a) => (created.isDefault ? { ...a, isDefault: false } : a))]);
      setShowAddressForm(false);
      setAddr({ fullName: '', phone: '', addressLine1: '', city: '', isDefault: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save address');
    }
  };

  const removeAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete address');
    }
  };

  return (
    <Page>
      <Container style={{ paddingVertical: isWide ? 56 : 32, gap: 28, maxWidth: 680 }}>
        {/* Header with avatar */}
        <View style={styles.header}>
          <Pressable onPress={pickAvatar} disabled={avatarBusy || !isBackendConfigured} style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            {isBackendConfigured && (
              <View style={styles.avatarBadge}>
                <Ionicons name={avatarBusy ? 'hourglass-outline' : 'camera'} size={12} color="#fff" />
              </View>
            )}
          </Pressable>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={isWide ? font.h2 : font.h2Sm}>{displayName}</Text>
              {vendor?.verificationStatus === 'VERIFIED' && (
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              )}
            </View>
            <Text style={[font.small, { color: colors.muted }]}>{user.email}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {displayRoles.map((r) => (
                <Chip key={r} label={ROLE_LABELS[r] ?? r} tone={r === 'ADMIN' ? 'warn' : r === 'VENDOR' ? 'primary' : 'default'} />
              ))}
            </View>
            {isBackendConfigured && (
              <View style={{ flexDirection: 'row', gap: 14, marginTop: 2 }}>
                <VerifiedBadge verified={!!me?.emailVerified} label={me?.emailVerified ? 'Email verified' : 'Email unverified'} />
                <VerifiedBadge verified={!!me?.phoneVerified} label={me?.phoneVerified ? 'Phone verified' : 'Phone unverified'} />
              </View>
            )}
          </View>
        </View>

        {!!error && <Text style={[font.small, { color: colors.danger }]}>{error}</Text>}
        {!!notice && <Text style={[font.small, { color: colors.success }]}>{notice}</Text>}

        {/* Email verification */}
        {isBackendConfigured && me && !me.emailVerified && (
          <Section title="Verify your email">
            <View style={styles.card}>
              <Text style={[font.small, { color: colors.muted }]}>
                We sent a verification link to <Text style={{ fontWeight: '600', color: colors.text }}>{me.email}</Text>. Click it to verify your account.
              </Text>
              <Button title="Resend verification email" variant="outline" size="sm" onPress={resendEmail} style={{ alignSelf: 'flex-start' }} />
            </View>
          </Section>
        )}

        {/* Phone verification */}
        {isBackendConfigured && me && !me.phoneVerified && (
          <Section title="Verify your phone">
            <View style={styles.card}>
              {me.phone ? (
                <>
                  <Text style={[font.small, { color: colors.muted }]}>
                    We'll send a 6-digit code to <Text style={{ fontWeight: '600', color: colors.text }}>{me.phone}</Text>.
                  </Text>
                  {otpSent ? (
                    <View style={{ gap: 10 }}>
                      <Field label="Verification code" value={otpCode} onChangeText={setOtpCode} keyboardType="number-pad" maxLength={6} placeholder="123456" />
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Button title="Verify" size="sm" onPress={confirmOtp} loading={otpBusy} />
                        <Button title="Resend code" size="sm" variant="ghost" onPress={sendOtp} />
                      </View>
                    </View>
                  ) : (
                    <Button title="Send verification code" variant="outline" size="sm" onPress={sendOtp} loading={otpBusy} style={{ alignSelf: 'flex-start' }} />
                  )}
                </>
              ) : (
                <Text style={[font.small, { color: colors.muted }]}>
                  Add a phone number in Personal information below, then verify it here.
                </Text>
              )}
            </View>
          </Section>
        )}

        {/* Personal info */}
        <Section title="Personal information">
          <View style={styles.card}>
            {isBackendConfigured ? (
              <>
                <View style={styles.row2}>
                  <View style={{ flex: 1 }}><Field label="First name" value={firstName} onChangeText={setFirstName} /></View>
                  <View style={{ flex: 1 }}><Field label="Last name" value={lastName} onChangeText={setLastName} /></View>
                </View>
                <Field label="Phone (recovery)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+243…" />
                <Field label="Email" value={user.email ?? ''} editable={false} />
                <Button title="Save changes" size="sm" onPress={saveProfile} loading={saving} style={{ alignSelf: 'flex-start' }} />
              </>
            ) : (
              <Text style={[font.small, { color: colors.muted }]}>Profile editing requires the Soko backend (EXPO_PUBLIC_API_URL).</Text>
            )}
          </View>
        </Section>

        {/* Identity verification — ID document verifies the user account */}
        {isBackendConfigured && (
          <Section title="Identity verification">
            <View style={styles.card}>
              {vendor?.verificationStatus === 'VERIFIED' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="shield-checkmark" size={22} color={colors.success} />
                  <Text style={[font.small, { color: colors.success, fontWeight: '600' }]}>Your account is verified.</Text>
                </View>
              ) : vendor?.verificationStatus === 'PENDING' ? (
                <View style={{ gap: 4 }}>
                  <Text style={[font.small, { color: '#B7791F', fontWeight: '600' }]}>Verification in review</Text>
                  <Text style={[font.small, { color: colors.muted }]}>We're reviewing your ID document. This usually takes 1–2 business days.</Text>
                </View>
              ) : (
                <>
                  <Text style={[font.small, { color: colors.muted }]}>
                    Verify your account with your government ID. Your details are only used for verification.
                  </Text>
                  {vendor?.verificationStatus === 'REJECTED' && vendor.verificationNote && (
                    <Text style={[font.small, { color: colors.danger }]}>Previous submission rejected: {vendor.verificationNote}</Text>
                  )}
                  <Field label="ID number" value={idNumber} onChangeText={setIdNumber} autoCapitalize="characters" />
                  <Field label="Date of birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} placeholder="1995-04-23" />
                  <View>
                    <Text style={styles.fieldLabel}>ID document photo</Text>
                    <Pressable style={styles.uploadBox} onPress={pickIdDoc}>
                      {idDoc ? (
                        <Image source={{ uri: assetUrl(idDoc) ?? undefined }} style={styles.uploadImg} />
                      ) : (
                        <View style={{ alignItems: 'center', gap: 4 }}>
                          <Ionicons name="cloud-upload-outline" size={22} color={colors.subtle} />
                          <Text style={[font.small, { color: colors.muted, fontSize: 11 }]}>Tap to upload</Text>
                        </View>
                      )}
                    </Pressable>
                  </View>
                  <Button title="Submit for verification" size="sm" onPress={submitVerification} loading={verifyBusy} style={{ alignSelf: 'flex-start' }} />
                </>
              )}
            </View>
          </Section>
        )}

        {/* Addresses */}
        {isBackendConfigured && (
          <Section title="Saved addresses">
            <View style={{ gap: 10 }}>
              {addresses.length === 0 && !showAddressForm && (
                <Text style={[font.small, { color: colors.muted }]}>No saved addresses yet.</Text>
              )}
              {addresses.map((a) => (
                <View key={a.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[font.small, { fontWeight: '600' }]}>
                        {a.fullName} {a.isDefault ? '· Default' : ''}
                      </Text>
                      <Text style={[font.small, { color: colors.muted }]}>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</Text>
                      <Text style={[font.small, { color: colors.muted }]}>{a.city}{a.region ? `, ${a.region}` : ''} · {a.country}</Text>
                      <Text style={[font.small, { color: colors.muted }]}>{a.phone}</Text>
                    </View>
                    <Pressable onPress={() => removeAddress(a.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}

              {showAddressForm ? (
                <View style={styles.card}>
                  <View style={styles.row2}>
                    <View style={{ flex: 1 }}><Field label="Full name" value={addr.fullName} onChangeText={(v) => setAddr({ ...addr, fullName: v })} /></View>
                    <View style={{ flex: 1 }}><Field label="Phone" value={addr.phone} onChangeText={(v) => setAddr({ ...addr, phone: v })} keyboardType="phone-pad" /></View>
                  </View>
                  <Field label="Address line 1" value={addr.addressLine1} onChangeText={(v) => setAddr({ ...addr, addressLine1: v })} />
                  <Field label="City" value={addr.city} onChangeText={(v) => setAddr({ ...addr, city: v })} />
                  <Pressable onPress={() => setAddr({ ...addr, isDefault: !addr.isDefault })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name={addr.isDefault ? 'checkbox' : 'square-outline'} size={20} color={addr.isDefault ? colors.primary : colors.muted} />
                    <Text style={[font.small, { color: colors.text }]}>Set as default address</Text>
                  </Pressable>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button title="Save address" size="sm" onPress={saveAddress} />
                    <Button title="Cancel" size="sm" variant="ghost" onPress={() => setShowAddressForm(false)} />
                  </View>
                </View>
              ) : (
                <Button title="Add address" variant="outline" size="sm" onPress={() => setShowAddressForm(true)} style={{ alignSelf: 'flex-start' }} />
              )}
            </View>
          </Section>
        )}

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <Button title="My Orders" href="/orders" />
          {isAdmin && <Button title="Admin Dashboard" variant="outline" href="/admin" />}
          <Button
            title="Log Out"
            variant="ghost"
            onPress={async () => {
              await signOut();
              router.replace('/');
            }}
          />
        </View>
      </Container>
      <UploadPreview preview={preview} onClose={() => setPreview(null)} />
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  section: { gap: 10 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    backgroundColor: '#fff',
  },
  row2: { flexDirection: 'row', gap: 12 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  fieldLabel: { ...font.small, color: colors.text, fontWeight: '500', marginBottom: 6 },
  uploadBox: {
    height: 110,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.soft,
  },
  uploadImg: { width: '100%', height: '100%' },
});
