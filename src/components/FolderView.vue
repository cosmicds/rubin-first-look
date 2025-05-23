<template>
  <div
    class="fv-root"
    v-if="items !== null"
    :style="cssVars"
  >
    <div
      :class="['item', lastSelectedItem === item ? 'selected' : '']"
      v-for="item of items"
      :key="item.get_name()"
      :title="item.get_name()"
      @click="() => selectItem(item)"
    >
      <img :src="item.get_thumbnailUrl()" :alt="item.get_name()" />
      <div
        class="item-name"
      >{{item.get_name()}}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref } from "vue";
import { Folder, FolderUp, Place, Imageset } from "@wwtelescope/engine";
import { ImageSetType, Thumbnail } from "@wwtelescope/engine-types";
import { FolderViewProps } from "../types";

const items: Ref<Thumbnail[] | null> = ref([]);
const lastSelectedItem: Ref<Thumbnail | null> = ref(null);

const props = defineProps<FolderViewProps>();

const emit = defineEmits<{
  (event: "select", item: Thumbnail): void;
}>();

function selectItem(item: Thumbnail) {
  lastSelectedItem.value = item;
  if (item instanceof Folder || item instanceof FolderUp) {
    items.value = item.get_children();
  }

  emit("select", item);
}

const cssVars = computed(() => ({
  "--flex-direction": props.flexDirection,
}));
</script>
