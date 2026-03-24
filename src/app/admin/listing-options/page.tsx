import AdminListingOptionsManager from "@/components/admin/admin-listing-options-manager";
import { getListingOptionsForAdmin } from "@/lib/horses/listing-options";

export default async function AdminListingOptionsPage() {
  const data = await getListingOptionsForAdmin();

  return <AdminListingOptionsManager data={data} />;
}
