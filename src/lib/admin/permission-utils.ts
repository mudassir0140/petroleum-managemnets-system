import type { FeatureId } from "@/lib/admin/permissions";
import { FEATURES } from "@/lib/admin/permissions";

export function getFeatureName(featureId: FeatureId): string {
  const feature = FEATURES.find((f) => f.id === featureId);
  return feature?.name || featureId;
}

export function getFeatureCategory(featureId: FeatureId): string {
  const feature = FEATURES.find((f) => f.id === featureId);
  return feature?.category || "Other";
}

export function getFeatureDescription(featureId: FeatureId): string {
  const feature = FEATURES.find((f) => f.id === featureId);
  return feature?.description || "";
}

export function canAccessFeature(
  customPermissions: FeatureId[],
  featureId: FeatureId,
  isAdmin: boolean = false
): boolean {
  // Admins have access to everything
  if (isAdmin) return true;

  // Check if user has the specific permission
  return customPermissions.includes(featureId);
}

export function getAccessibleFeatures(
  customPermissions: FeatureId[]
): (typeof FEATURES)[number][] {
  return FEATURES.filter((feature) => customPermissions.includes(feature.id));
}

export function groupFeaturesByCategory(features: FeatureId[]): Record<string, (typeof FEATURES)[number][]> {
  const grouped: Record<string, (typeof FEATURES)[number][]> = {};

  features.forEach((featureId) => {
    const feature = FEATURES.find((f) => f.id === featureId);
    if (feature) {
      if (!grouped[feature.category]) {
        grouped[feature.category] = [];
      }
      grouped[feature.category].push(feature);
    }
  });

  return grouped;
}
