import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import RelativeTime from "../RelativeTime.vue";

describe("RelativeTime", () => {
  it("renders 'just now' for a date in the last few seconds", () => {
    const wrapper = mount(RelativeTime, {
      props: { date: new Date() },
    });
    expect(wrapper.text()).toBe("just now");
  });

  it("sets the title to the ISO timestamp of the given date", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    const wrapper = mount(RelativeTime, {
      props: { date },
    });
    expect(wrapper.attributes("title")).toBe(date.toISOString());
  });
});
