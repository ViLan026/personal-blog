import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidSlug, slugify } from "@/lib/slug";

test("slugify strips Vietnamese diacritics and maps đ to d", () => {
  assert.equal(slugify("Quản lý bộ nhớ"), "quan-ly-bo-nho");
  assert.equal(slugify("Đại Việt Sử Ký Toàn Thư"), "dai-viet-su-ky-toan-thu");
});

test("slugify turns punctuation and symbols into single hyphens", () => {
  assert.equal(slugify("TCP/IP"), "tcp-ip");
  assert.equal(slugify("CI/CD"), "ci-cd");
  assert.equal(slugify("Spring Boot & JPA"), "spring-boot-and-jpa");
  assert.equal(slugify("C++ & C#"), "c-and-c");
  assert.equal(slugify("  many   spaces -- and --- dashes  "), "many-spaces-and-dashes");
});

test("slugify lowercases and keeps digits", () => {
  assert.equal(slugify("Java 21 Features"), "java-21-features");
});

test("slugify returns an empty string when nothing usable remains", () => {
  assert.equal(slugify(""), "");
  assert.equal(slugify("   "), "");
  assert.equal(slugify("!!! ???"), "");
});

test("slugify respects the max length without leaving a trailing hyphen", () => {
  assert.equal(slugify("hello world", 6), "hello");
  assert.ok(slugify("word ".repeat(100), 20).length <= 20);
  assert.ok(!slugify("word ".repeat(100), 20).endsWith("-"));
});

test("isValidSlug accepts only lowercase words joined by single hyphens", () => {
  for (const ok of ["a", "java", "spring-boot", "java-21", "a1-b2-c3"]) {
    assert.equal(isValidSlug(ok), true, ok);
  }
  for (const bad of ["", "Java", "a b", "-a", "a-", "a--b", "a_b", "tcp/ip", "quản-lý", "a.b"]) {
    assert.equal(isValidSlug(bad), false, bad);
  }
});

test("everything slugify produces from non-empty usable text is a valid slug", () => {
  for (const input of ["Quản lý bộ nhớ", "TCP/IP", "Spring Boot & JPA", "Java 21", "Đại Việt"]) {
    assert.equal(isValidSlug(slugify(input)), true, input);
  }
});
