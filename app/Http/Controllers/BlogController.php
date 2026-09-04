<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\BlogPost;

class BlogController extends Controller
{
    public function index()
    {
        $posts = BlogPost::where('published', true)->orderBy('created_at', 'desc')->get();
        return Inertia::render('Blog/Index', [
            'initialPosts' => $posts,
        ]);
    }

    public function show(string $slug)
    {
        $post = BlogPost::where('slug', $slug)->first();
        return Inertia::render('Blog/Show', [
            'slug' => $slug,
            'post' => $post,
        ]);
    }
}
