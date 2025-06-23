<template>
  <nav
    class="fv-root"
    v-if="items !== null"
    :style="cssVars"
    aria-role="navigation"
    aria-label="Available Locations"
  >
    <div
      class="fv-header-container"
    >
      <slot
        name="header"
        :expanded="expanded"
        :toggle-expanded="toggleExpanded"
      ></slot>
    </div>
    <div
      v-show="expanded"
      class="fv-content"
    >
      <div
        :class="['item', lastSelectedItem === item ? 'selected' : '']"
        v-for="item of items"
        :key="item.get_name()"
        :title="item.get_name()"
        @click="() => selectItem(item, 'click')"
        @dblclick="() => selectItem(item, 'dblclick')"
        @keydown.enter="() => selectItem(item, 'keyup')"
        tabindex="0"
        role="button"
        :aria-label="item.get_name()"
        :aria-selected="lastSelectedItem === item"
      >
        <img :src="item.get_thumbnailUrl()" :alt="item.get_name()" />
        <div
          class="item-name"
        >{{item.get_name()}}</div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type Ref } from "vue";
import { Folder, FolderUp, Place } from "@wwtelescope/engine";
import { Thumbnail } from "@wwtelescope/engine-types";
import { FolderViewProps, ItemSelectionType } from "../types";

const items: Ref<Thumbnail[] | null> = ref<Thumbnail[]>([]);
const lastSelectedItem: Ref<Thumbnail | null> = ref(null);


const props = withDefaults(defineProps<FolderViewProps>(), {
  gap: "5px",
  highlightColor: "#1671e0",
  thumbnailColor: "white",
  backgroundColor: "black",
  textColor: "white",
});

const emit = defineEmits<{
  (event: "select", data: { item: Thumbnail, type: ItemSelectionType }): void;
}>();

const expanded = ref(true);
function toggleExpanded() {
  expanded.value = !expanded.value;
}

function updateFolder(folder: Folder) {
  const folderItems = folder.get_children()?.filter(item => item instanceof Place) ?? [];
  items.value = folderItems;
  const firstItem = items.value.find((item) => (!(item instanceof Folder) || (item instanceof FolderUp)));
  if (firstItem) {
    selectItem(firstItem, "folder");
  }
}

function selectItem(item: Thumbnail, type: ItemSelectionType) {
  lastSelectedItem.value = item;
  if (item instanceof Folder || item instanceof FolderUp) {
    items.value = item.get_children();
  }

  emit("select", { item, type });
}

onMounted(() => {
  updateFolder(props.rootFolder);
});

watch(() => props.rootFolder, updateFolder);

const cssVars = computed(() => ({
  "--flex-direction": props.flexDirection,
  "--background-color": props.backgroundColor,
  "--thumbnail-color": props.thumbnailColor,
  "--highlight-color": props.highlightColor,
  "--text-color": props.textColor,
  "--gap": props.gap,
}));
</script>

<style scoped lang="less">
.fv-root {
  width: auto;
	height: 100%;
  overflow-x: auto;
  overflow-y: auto;
  background: var(--background-color);

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

.fv-header-container {
  pointer-events: auto;
  padding: 5px;
  user-select: none;
  -ms-user-select: none;
  -moz-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
}

.fv-content {
  margin: auto;
  display: flex;
  flex-direction: var(--flex-direction);
  align-items: center;
  justify-content: space-around;
  gap: var(--gap);

  &::after {
    content: "";
    height: 0px;
  }
}

.item {
  padding: 1px;
  border: 1px solid #444;
  background: var(--thumbnail-color);
  border-radius: 2px;
  width: ~"min(96px, 16vw)";
  color: var(--text-color);
  cursor: pointer;
  pointer-events: auto;

  & img {
    width: 100%;
    height: ~"min(45px, 7.5vw)";
    object-fit: cover;
    border-radius: 2px;
  }
	
	&:hover {
		border: 2px solid var(--highlight-color);
		transition: all 200ms ease-out;
  }

  &.selected {
    border: 2px solid var(--highlight-color);
  }
}

.item-name {
  color: var(--text-color);
  width: 100%;
  font-size: 7pt;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding-left: 2px;
}
</style>
