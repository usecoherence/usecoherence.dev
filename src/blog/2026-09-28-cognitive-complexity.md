---
layout: layout.njk
title: Cognitive Complexity
description: Translating cognitive load into deterministic metrics and CI gates.
---

# Cognitive Complexity

Recommended reading: https://github.com/zakirullin/cognitive-load

> Cognitive load is how much a developer needs to think in order to complete a task.

Unfortunately this is prose but there are some efforts towards formalizing it [1][2].

The goal is to translate them to metrics and deterministic methods so we can add import and use it as CI gate.

The very basic idea I've been thinking about is that brain can only hold at most 4 items in working memory:
1. if (condition1 && condition2 && cond3 && cond4)
2. object1 <->object2 <-> object3 <->object4
3. Z extends A extends B extends C
4. function1() / f2() / f3() / f4()

This seem to be very limiting but also gives us a useful insight:

> A useful side-effect should be contained within 4 primitives.

I used SHOULD here because realistically it would be very hard to translate something naturally complicated into just 4 primitives. For example, attribute-based access control: User can edit his own comment inside a post that belongs to the group he is part of.

> User <-> can <-> edit <-> comment <-> post <-> group <-> belongs_to

As you can see, there are already 7 primitives.

What is a primitive?
Let's go back to state and state transitions for a moment.

State is an object that contains some values. A graph node with properties. Transition is a transformation function that takes existing state, transformation rules, and returns a new state.

Existing "User" object is a "State". Editing a "Comment" is a "State Transition" that takes "User", existing "Comment", new "Comment", transformation rules, and returns either updated "Comment" state or an "Error" state with the description.

> Now, we can define a single "Primitive" either as "State" or "State Transition".

This is a useful definition, but how do we simplify the 7-primitive statement down to a 4-primitive statement?

Lets illustrate this with simple Ruby code, shall we?
```ruby
group = Group.new
user = User.new(belongs_to: group)
post = Post.new(belongs_to: group)
comment = Comment.new(belongs_to: post, owner: user)

def can_edit_comment?(user, comment)
  user.group == comment.group && user.id == comment.owner.id
end

return can_edit_comment?(user, comment)
```

Sources:
1. Tools: SonarJS cognitive-complexity, ESLint max-depth / max-nested-callbacks, dependency-cruiser, ArchUnit, eslint-plugin-boundaries, complexipy, gocognit, RuboCop Metrics, Packwerk, Tach.
2. Research: “An Empirical Validation of Cognitive Complexity” — https://arxiv.org/abs/2007.12520; “Early Career Developers’ Perceptions of Code Understandability” — https://arxiv.org/abs/2303.07722.T
