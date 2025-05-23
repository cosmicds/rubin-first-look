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
import { computed, onMounted, ref, type Ref } from "vue";
import { Folder, FolderUp, Place } from "@wwtelescope/engine";
import { Thumbnail } from "@wwtelescope/engine-types";
import { FolderViewProps } from "../types";

const items: Ref<Thumbnail[] | null> = ref<Thumbnail[]>([]);
const lastSelectedItem: Ref<Thumbnail | null> = ref(null);

const props = defineProps<FolderViewProps>();

const emit = defineEmits<{
  (event: "select", item: Thumbnail): void;
}>();

onMounted(() => {
  const folderItems = [];
  const propItems = props.rootFolder.get_children() ?? [];
  for (const c of propItems) {
    if (c instanceof Place) {
      folderItems.push(c); 
    }
  }
  items.value = folderItems;
  const firstItem = items.value.find((item) => (!(item instanceof Folder) || (item instanceof FolderUp)));
  if (firstItem) {
    selectItem(firstItem);
  }
});


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

<style scoped lang="less">
.fv-root {
  display: flex;
  flex-direction: var(--flex-direction);
  width: auto;
	height: 100%;
  overflow-x: auto;
  overflow-y: auto;
  background: black;

	&::-webkit-scrollbar {
    padding: 1px;
    height: 3px;
		width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.07);
  }

  &::-webkit-scrollbar-thumb {
    background: #1671e0;
    border-radius: 10px;
  }
	
	

  //width: 100%;
  //justify-content: space-around;
}

.item {
  padding: 3px;
  border: 1px solid #444;
  border-radius: 2px;
  width: ~"min(96px, 16vw)";
  cursor: pointer;
  pointer-events: auto;

  & img {
    width: 100%;
    height: ~"min(45px, 7.5vw)";
    object-fit: cover;
    border-radius: 2px;
  }
	
	&:hover {
		border: 1px solid #1671e0;
		transition: all 200ms ease-out;
  }

  &.selected {
    border: 1px solid #1671e0;
  }
}

.item-name {
  color: white;
  width: 100%;
  font-size: 7pt;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
</style>
