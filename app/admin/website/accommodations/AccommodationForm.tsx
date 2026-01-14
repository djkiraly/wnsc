'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, ArrowLeft } from 'lucide-react';

interface Props { accommodation?: { id: string; name: string; slug: string; description: string | null; type: string; address: string; city: string; phone: string | null; email: string | null; website: string | null; bookingUrl: string | null; priceRange: string | null; roomCount: number | null; amenities: string[]; imageUrl: string | null; isPartner: boolean; isActive: boolean; isFeatured: boolean; sortOrder: number; }; }

const types = [{ value: 'hotel', label: 'Hotel' }, { value: 'motel', label: 'Motel' }, { value: 'campground', label: 'Campground' }, { value: 'bnb', label: 'B&B' }, { value: 'other', label: 'Other' }];
const priceRanges = ['$', '$$', '$$$', '$$$$'];
const amenityOptions = ['Pool', 'Fitness Center', 'Free WiFi', 'Free Parking', 'Breakfast', 'Pet Friendly', 'Restaurant', 'Room Service', 'Business Center', 'Laundry'];

export default function AccommodationForm({ accommodation }: Props) {
  const router = useRouter();
  const isEditing = !!accommodation;
  const [formData, setFormData] = useState({
    name: accommodation?.name || '', slug: accommodation?.slug || '', description: accommodation?.description || '', type: accommodation?.type || 'hotel',
    address: accommodation?.address || '', city: accommodation?.city || '', phone: accommodation?.phone || '', email: accommodation?.email || '',
    website: accommodation?.website || '', bookingUrl: accommodation?.bookingUrl || '', priceRange: accommodation?.priceRange || '',
    roomCount: accommodation?.roomCount?.toString() || '', amenities: accommodation?.amenities || [], imageUrl: accommodation?.imageUrl || '',
    isPartner: accommodation?.isPartner ?? false, isActive: accommodation?.isActive ?? true, isFeatured: accommodation?.isFeatured ?? false, sortOrder: accommodation?.sortOrder ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const url = isEditing ? `/api/accommodations/${accommodation.id}` : '/api/accommodations';
      const r = await fetch(url, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, roomCount: formData.roomCount ? parseInt(formData.roomCount) : null }) });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Failed'); setSaving(false); return; }
      router.push('/admin/website/accommodations'); router.refresh();
    } catch { setError('Error'); setSaving(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((p) => ({ ...p, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };
  const toggleAmenity = (a: string) => setFormData((p) => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a] }));
  const generateSlug = () => setFormData((p) => ({ ...p, slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/website/accommodations" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-3xl font-bold">{isEditing ? 'Edit Accommodation' : 'New Accommodation'}</h1>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save'}</button>
      </div>
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card"><div className="card-header"><h2 className="text-lg font-semibold">Basic Info</h2></div>
            <div className="card-body space-y-4">
              <div><label className="label">Name *</label><input name="name" value={formData.name} onChange={handleChange} onBlur={() => !formData.slug && generateSlug()} className="input" required /></div>
              <div><label className="label">Slug * <button type="button" onClick={generateSlug} className="text-primary text-sm ml-2">Generate</button></label><input name="slug" value={formData.slug} onChange={handleChange} className="input" required /></div>
              <div><label className="label">Description</label><textarea name="description" value={formData.description} onChange={handleChange} className="textarea" rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Type *</label><select name="type" value={formData.type} onChange={handleChange} className="select">{types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div><label className="label">City *</label><input name="city" value={formData.city} onChange={handleChange} className="input" required /></div>
              </div>
              <div><label className="label">Address *</label><input name="address" value={formData.address} onChange={handleChange} className="input" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Phone</label><input name="phone" value={formData.phone} onChange={handleChange} className="input" /></div>
                <div><label className="label">Email</label><input name="email" type="email" value={formData.email} onChange={handleChange} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Website</label><input name="website" type="url" value={formData.website} onChange={handleChange} className="input" /></div>
                <div><label className="label">Booking URL</label><input name="bookingUrl" type="url" value={formData.bookingUrl} onChange={handleChange} className="input" /></div>
              </div>
            </div>
          </div>
          <div className="card"><div className="card-header"><h2 className="text-lg font-semibold">Amenities</h2></div>
            <div className="card-body"><div className="flex flex-wrap gap-2">{amenityOptions.map((a) => (<button key={a} type="button" onClick={() => toggleAmenity(a)} className={`px-3 py-1.5 rounded-full text-sm font-medium ${formData.amenities.includes(a) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>{a}</button>))}</div></div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card"><div className="card-header"><h2 className="text-lg font-semibold">Details</h2></div>
            <div className="card-body space-y-4">
              <div><label className="label">Price Range</label><select name="priceRange" value={formData.priceRange} onChange={handleChange} className="select"><option value="">Select...</option>{priceRanges.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
              <div><label className="label">Room Count</label><input name="roomCount" type="number" value={formData.roomCount} onChange={handleChange} className="input" min="0" /></div>
            </div>
          </div>
          <div className="card"><div className="card-header"><h2 className="text-lg font-semibold">Status</h2></div>
            <div className="card-body space-y-4">
              <div className="flex items-center gap-2"><input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4" /><label className="text-sm">Active</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" name="isPartner" checked={formData.isPartner} onChange={handleChange} className="h-4 w-4" /><label className="text-sm">Partner</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="h-4 w-4" /><label className="text-sm">Featured</label></div>
              <div><label className="label">Sort Order</label><input name="sortOrder" type="number" value={formData.sortOrder} onChange={handleChange} className="input" min="0" /></div>
            </div>
          </div>
          <div className="card"><div className="card-header"><h2 className="text-lg font-semibold">Image</h2></div>
            <div className="card-body"><input name="imageUrl" type="url" value={formData.imageUrl} onChange={handleChange} className="input" placeholder="https://" />{formData.imageUrl && <img src={formData.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg mt-4" />}</div>
          </div>
        </div>
      </div>
    </form>
  );
}
